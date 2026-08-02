using System.Text.Json;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.Observability;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace BitFinance.API.Services;

public sealed class NotificationDispatcher(
    ApplicationDbContext dbContext,
    IEmailSender emailSender,
    IOptions<NotificationOptions> options,
    OutboxTelemetry telemetry,
    ILogger<NotificationDispatcher> logger)
{
    private const int BatchSize = 50;
    private static readonly TimeSpan LeaseDuration = TimeSpan.FromMinutes(2);
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly NotificationOptions _options = options.Value;

    public async Task ProcessAsync(CancellationToken cancellationToken)
    {
        await telemetry.TryRefreshBacklogAsync(dbContext, cancellationToken);

        var messageIds = await ClaimOutboxAsync(cancellationToken);
        telemetry.RecordFetched(messageIds.Count);
        foreach (var messageId in messageIds)
            await ProcessOutboxMessageAsync(messageId, cancellationToken);

        var deliveryIds = await ClaimDeliveriesAsync(cancellationToken);
        telemetry.RecordFetched(deliveryIds.Count);
        foreach (var deliveryId in deliveryIds)
            await ProcessDeliveryAsync(deliveryId, cancellationToken);
    }

    public async Task CleanupAsync(CancellationToken cancellationToken)
    {
        var notificationCutoff = DateTime.UtcNow.AddDays(-90);
        var infrastructureCutoff = DateTime.UtcNow.AddDays(-30);

        await dbContext.Notifications
            .Where(notification => notification.ReadAt != null && notification.ReadAt < notificationCutoff)
            .ExecuteDeleteAsync(cancellationToken);
        await dbContext.NotificationOutboxMessages
            .Where(message => message.ProcessedAt != null && message.ProcessedAt < infrastructureCutoff)
            .ExecuteDeleteAsync(cancellationToken);
        await dbContext.ProviderWebhookReceipts
            .Where(receipt => receipt.ReceivedAt < infrastructureCutoff)
            .ExecuteDeleteAsync(cancellationToken);
    }

    private async Task<IReadOnlyList<Guid>> ClaimOutboxAsync(CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var messages = await dbContext.NotificationOutboxMessages
            .FromSqlInterpolated($$"""
                SELECT * FROM notification_outbox_messages
                WHERE processed_at IS NULL
                  AND next_attempt_at <= {{now}}
                  AND (locked_until IS NULL OR locked_until < {{now}})
                ORDER BY created_at
                LIMIT {{BatchSize}}
                FOR UPDATE SKIP LOCKED
                """)
            .ToListAsync(cancellationToken);

        foreach (var message in messages)
            message.LockedUntil = now.Add(LeaseDuration);

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        var ids = messages.Select(message => message.Id).ToList();
        dbContext.ChangeTracker.Clear();
        return ids;
    }

    private async Task ProcessOutboxMessageAsync(Guid messageId, CancellationToken cancellationToken)
    {
        var message = await dbContext.NotificationOutboxMessages.FirstOrDefaultAsync(
            item => item.Id == messageId, cancellationToken);
        if (message is null) return;

        try
        {
            var organization = await dbContext.Organizations
                .Include(item => item.Members)
                    .ThenInclude(member => member.User)
                .FirstOrDefaultAsync(item => item.Id == message.OrganizationId, cancellationToken);
            if (organization is null)
            {
                message.ProcessedAt = DateTime.UtcNow;
                message.LockedUntil = null;
                await dbContext.SaveChangesAsync(cancellationToken);
                telemetry.RecordDelivered();
                return;
            }

            var payload = JsonSerializer.Deserialize<NotificationEventPayload>(message.PayloadJson, JsonOptions)
                ?? new NotificationEventPayload();
            var recipientIds = IsBillType(message.Type)
                ? organization.Members.Select(member => member.UserId).Distinct(StringComparer.Ordinal).ToList()
                : NotificationRules.GetMembershipRecipientIds(organization.Members).ToList();
            var actionPath = IsBillType(message.Type) && payload.BillId is { } billId
                ? $"/dashboard/bills/{billId}"
                : "/organization/members";

            foreach (var recipientId in recipientIds)
            {
                var exists = await dbContext.Notifications.AnyAsync(notification =>
                    notification.SourceEventId == message.Id && notification.RecipientUserId == recipientId,
                    cancellationToken);
                if (exists) continue;

                var notification = new Notification
                {
                    SourceEventId = message.Id,
                    OrganizationId = message.OrganizationId,
                    RecipientUserId = recipientId,
                    Type = message.Type,
                    PayloadJson = message.PayloadJson,
                    ActionPath = actionPath,
                };
                dbContext.Notifications.Add(notification);

                if (!IsBillType(message.Type) || !emailSender.IsConfigured) continue;
                var preferenceEnabled = await dbContext.NotificationPreferences
                    .Where(preference => preference.OrganizationId == organization.Id && preference.UserId == recipientId)
                    .Select(preference => (bool?)preference.EmailBillRemindersEnabled)
                    .FirstOrDefaultAsync(cancellationToken) ?? true;
                if (NotificationRules.CanSendBillEmail(
                        organization.EffectivePlanTier, preferenceEnabled, emailSender.IsConfigured))
                {
                    notification.Deliveries.Add(new NotificationDelivery());
                }
            }

            message.ProcessedAt = DateTime.UtcNow;
            message.LockedUntil = null;
            message.LastError = null;
            await dbContext.SaveChangesAsync(cancellationToken);
            telemetry.RecordDelivered();
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Notification outbox message processing failed");
            dbContext.ChangeTracker.Clear();
            message = await dbContext.NotificationOutboxMessages.FirstAsync(item => item.Id == messageId, cancellationToken);
            message.Attempts++;
            message.LockedUntil = null;
            message.LastError = $"{exception.GetType().Name}: notification dispatch failed";
            var nextAttempt = NotificationRetryPolicy.GetNextAttemptAt(message.Attempts, DateTime.UtcNow);
            if (nextAttempt is null)
            {
                message.ProcessedAt = DateTime.UtcNow;
                telemetry.RecordTerminalFailure();
            }
            else
            {
                message.NextAttemptAt = nextAttempt.Value;
                telemetry.RecordRescheduled();
            }
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        finally
        {
            dbContext.ChangeTracker.Clear();
        }
    }

    private async Task<IReadOnlyList<Guid>> ClaimDeliveriesAsync(CancellationToken cancellationToken)
    {
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var now = DateTime.UtcNow;
        var deliveries = await dbContext.NotificationDeliveries
            .FromSqlInterpolated($$"""
                SELECT * FROM notification_deliveries
                WHERE status IN ('Pending', 'Processing')
                  AND next_attempt_at <= {{now}}
                  AND (locked_until IS NULL OR locked_until < {{now}})
                ORDER BY next_attempt_at
                LIMIT {{BatchSize}}
                FOR UPDATE SKIP LOCKED
                """)
            .ToListAsync(cancellationToken);

        foreach (var delivery in deliveries)
        {
            delivery.Status = NotificationDeliveryStatus.Processing;
            delivery.LockedUntil = now.Add(LeaseDuration);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        var ids = deliveries.Select(delivery => delivery.Id).ToList();
        dbContext.ChangeTracker.Clear();
        return ids;
    }

    private async Task ProcessDeliveryAsync(Guid deliveryId, CancellationToken cancellationToken)
    {
        var delivery = await dbContext.NotificationDeliveries
            .Include(item => item.Notification)
                .ThenInclude(notification => notification.RecipientUser)
            .Include(item => item.Notification)
                .ThenInclude(notification => notification.Organization)
            .FirstOrDefaultAsync(item => item.Id == deliveryId, cancellationToken);
        if (delivery is null) return;

        var notification = delivery.Notification;
        var organization = notification.Organization;
        var recipient = notification.RecipientUser;
        var stillMember = await dbContext.OrganizationMembers.AnyAsync(member =>
            member.OrganizationId == organization.Id && member.UserId == recipient.Id, cancellationToken);
        var preferenceEnabled = await dbContext.NotificationPreferences
            .Where(preference => preference.OrganizationId == organization.Id && preference.UserId == recipient.Id)
            .Select(preference => (bool?)preference.EmailBillRemindersEnabled)
            .FirstOrDefaultAsync(cancellationToken) ?? true;

        if (!stillMember
            || string.IsNullOrWhiteSpace(recipient.Email)
            || !NotificationRules.CanSendBillEmail(organization.EffectivePlanTier, preferenceEnabled, emailSender.IsConfigured))
        {
            delivery.Status = NotificationDeliveryStatus.Suppressed;
            delivery.LockedUntil = null;
            delivery.LastError = null;
            await dbContext.SaveChangesAsync(cancellationToken);
            dbContext.ChangeTracker.Clear();
            return;
        }

        try
        {
            var payload = JsonSerializer.Deserialize<NotificationEventPayload>(notification.PayloadJson, JsonOptions)
                ?? throw new InvalidOperationException("Notification payload is invalid.");
            var actionUrl = new Uri(new Uri(_options.FrontendBaseUrl.TrimEnd('/') + "/"), notification.ActionPath.TrimStart('/')).ToString();
            var result = await emailSender.SendBillReminderAsync(new BillReminderEmail(
                recipient.Email,
                recipient.FullName,
                organization.Name,
                payload.BillDescription ?? "Conta",
                payload.AmountDue ?? 0,
                payload.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow),
                notification.Type.ToString(),
                actionUrl), delivery.Id, cancellationToken);

            if (result.Success)
            {
                delivery.Status = NotificationDeliveryStatus.Sent;
                delivery.ProviderMessageId = result.ProviderMessageId;
                delivery.SentAt = DateTime.UtcNow;
                delivery.LockedUntil = null;
                delivery.LastError = null;
                telemetry.RecordDelivered();
            }
            else
            {
                RecordDeliveryRetry(ScheduleDeliveryRetry(
                    delivery,
                    result.Error ?? "Email provider rejected the request."));
            }
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Notification delivery failed");
            RecordDeliveryRetry(ScheduleDeliveryRetry(
                delivery,
                $"{exception.GetType().Name}: email delivery failed"));
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        dbContext.ChangeTracker.Clear();
    }

    private static bool ScheduleDeliveryRetry(NotificationDelivery delivery, string error)
    {
        delivery.Attempts++;
        delivery.LockedUntil = null;
        delivery.LastError = error.Length > 2000 ? error[..2000] : error;
        var nextAttempt = NotificationRetryPolicy.GetNextAttemptAt(delivery.Attempts, DateTime.UtcNow);
        if (nextAttempt is null)
        {
            delivery.Status = NotificationDeliveryStatus.Failed;
            return true;
        }
        else
        {
            delivery.Status = NotificationDeliveryStatus.Pending;
            delivery.NextAttemptAt = nextAttempt.Value;
        }

        return false;
    }

    private void RecordDeliveryRetry(bool terminalFailure)
    {
        if (terminalFailure)
            telemetry.RecordTerminalFailure();
        else
            telemetry.RecordRescheduled();
    }

    private static bool IsBillType(NotificationType type) => type is
        NotificationType.BillDueSoon or NotificationType.BillDueToday or NotificationType.BillOverdue;
}
