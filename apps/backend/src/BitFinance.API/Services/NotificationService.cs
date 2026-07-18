using System.Text.Json;
using BitFinance.API.Models;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Contexts;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace BitFinance.API.Services;

public sealed class NotificationService(ApplicationDbContext dbContext) : INotificationService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task EnqueueAsync(
        Guid organizationId,
        NotificationType type,
        string? aggregateId,
        string deduplicationKey,
        NotificationEventPayload payload,
        CancellationToken cancellationToken = default)
    {
        if (await dbContext.NotificationOutboxMessages.AnyAsync(
                message => message.DeduplicationKey == deduplicationKey, cancellationToken))
            return;

        var outboxMessage = new NotificationOutboxMessage
        {
            OrganizationId = organizationId,
            Type = type,
            AggregateId = aggregateId,
            DeduplicationKey = deduplicationKey,
            PayloadJson = JsonSerializer.Serialize(payload, JsonOptions),
        };
        dbContext.NotificationOutboxMessages.Add(outboxMessage);

        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            dbContext.Entry(outboxMessage).State = EntityState.Detached;
        }
    }

    public async Task<PagedResponse<NotificationResponse>> GetAsync(
        Guid organizationId,
        string userId,
        int page,
        int pageSize,
        bool unreadOnly,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = dbContext.Notifications.AsNoTracking()
            .Where(notification => notification.OrganizationId == organizationId
                && notification.RecipientUserId == userId);

        if (unreadOnly)
            query = query.Where(notification => notification.ReadAt == null);

        var totalRecords = await query.CountAsync(cancellationToken);
        var notifications = await query
            .OrderByDescending(notification => notification.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var data = notifications.Select(notification => new NotificationResponse(
            notification.Id,
            notification.Type.ToString(),
            JsonSerializer.Deserialize<JsonElement>(notification.PayloadJson, JsonOptions),
            notification.ActionPath,
            notification.CreatedAt,
            notification.ReadAt)).ToList();

        return new PagedResponse<NotificationResponse>(
            data,
            page,
            pageSize,
            totalRecords,
            (int)Math.Ceiling(totalRecords / (double)pageSize));
    }

    public Task<int> GetUnreadCountAsync(Guid organizationId, string userId, CancellationToken cancellationToken = default) =>
        dbContext.Notifications.CountAsync(notification =>
            notification.OrganizationId == organizationId
            && notification.RecipientUserId == userId
            && notification.ReadAt == null, cancellationToken);

    public async Task<bool> MarkReadAsync(
        Guid organizationId,
        string userId,
        Guid notificationId,
        CancellationToken cancellationToken = default)
    {
        var notification = await dbContext.Notifications.FirstOrDefaultAsync(item =>
            item.Id == notificationId
            && item.OrganizationId == organizationId
            && item.RecipientUserId == userId, cancellationToken);
        if (notification is null) return false;

        notification.ReadAt ??= DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return true;
    }

    public async Task MarkAllReadAsync(Guid organizationId, string userId, CancellationToken cancellationToken = default)
    {
        await dbContext.Notifications
            .Where(notification => notification.OrganizationId == organizationId
                && notification.RecipientUserId == userId
                && notification.ReadAt == null)
            .ExecuteUpdateAsync(updates => updates.SetProperty(
                notification => notification.ReadAt,
                _ => DateTime.UtcNow), cancellationToken);
    }

    public async Task<NotificationPreferenceResponse> GetPreferencesAsync(
        Guid organizationId,
        string userId,
        CancellationToken cancellationToken = default)
    {
        var preference = await dbContext.NotificationPreferences.AsNoTracking()
            .FirstOrDefaultAsync(item => item.OrganizationId == organizationId && item.UserId == userId, cancellationToken);
        var organization = await dbContext.Organizations.AsNoTracking()
            .FirstAsync(item => item.Id == organizationId, cancellationToken);

        return new NotificationPreferenceResponse(
            preference?.EmailBillRemindersEnabled ?? true,
            PlanEntitlement.For(organization.EffectivePlanTier).HasEmailNotifications);
    }

    public async Task<NotificationPreferenceResponse> UpdatePreferencesAsync(
        Guid organizationId,
        string userId,
        bool enabled,
        CancellationToken cancellationToken = default)
    {
        var preference = await dbContext.NotificationPreferences.FirstOrDefaultAsync(item =>
            item.OrganizationId == organizationId && item.UserId == userId, cancellationToken);

        if (preference is null)
        {
            preference = new NotificationPreference
            {
                OrganizationId = organizationId,
                UserId = userId,
                EmailBillRemindersEnabled = enabled,
            };
            dbContext.NotificationPreferences.Add(preference);
        }
        else
        {
            preference.EmailBillRemindersEnabled = enabled;
            preference.UpdatedAt = DateTime.UtcNow;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return await GetPreferencesAsync(organizationId, userId, cancellationToken);
    }
}
