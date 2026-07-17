using System.Text.Json;
using Asp.Versioning;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Svix;
using Svix.Exceptions;

namespace BitFinance.API.Controllers;

[ApiController]
[AllowAnonymous]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/webhooks/resend")]
public sealed class ResendWebhooksController(
    ApplicationDbContext dbContext,
    IOptions<NotificationOptions> options,
    ILogger<ResendWebhooksController> logger) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Receive(CancellationToken cancellationToken)
    {
        var secret = options.Value.ResendWebhookSecret;
        if (string.IsNullOrWhiteSpace(secret))
            return StatusCode(StatusCodes.Status503ServiceUnavailable);

        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(cancellationToken);
        try
        {
            new Webhook(secret).Verify(payload, header => Request.Headers[header ?? string.Empty].FirstOrDefault());
        }
        catch (WebhookVerificationException exception)
        {
            logger.LogWarning(exception, "Rejected invalid Resend webhook signature");
            return BadRequest();
        }

        JsonDocument document;
        try
        {
            document = JsonDocument.Parse(payload);
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "Rejected malformed Resend webhook payload");
            return BadRequest();
        }

        using (document)
        {
            var root = document.RootElement;
            var providerEventId = Request.Headers["svix-id"].FirstOrDefault();
            if (string.IsNullOrWhiteSpace(providerEventId)) return BadRequest();
            if (await dbContext.ProviderWebhookReceipts.AnyAsync(
                    receipt => receipt.ProviderEventId == providerEventId, cancellationToken))
                return Ok();

            var eventType = root.TryGetProperty("type", out var typeElement) ? typeElement.GetString() : null;
            var eventAt = root.TryGetProperty("created_at", out var createdElement)
                && createdElement.TryGetDateTime(out var parsedEventAt)
                ? parsedEventAt.ToUniversalTime()
                : DateTime.UtcNow;
            string? providerMessageId = null;
            if (root.TryGetProperty("data", out var data))
            {
                if (data.TryGetProperty("email_id", out var emailId)) providerMessageId = emailId.GetString();
                else if (data.TryGetProperty("id", out var id)) providerMessageId = id.GetString();
            }

            await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
            dbContext.ProviderWebhookReceipts.Add(new ProviderWebhookReceipt { ProviderEventId = providerEventId });
            if (!string.IsNullOrWhiteSpace(providerMessageId))
            {
                var delivery = await dbContext.NotificationDeliveries.FirstOrDefaultAsync(
                    item => item.ProviderMessageId == providerMessageId, cancellationToken);
                if (delivery is not null && (delivery.ProviderEventAt is null || delivery.ProviderEventAt < eventAt))
                {
                    delivery.ProviderEventAt = eventAt;
                    delivery.Status = eventType switch
                    {
                        "email.sent" => NotificationDeliveryStatus.Sent,
                        "email.delivered" => NotificationDeliveryStatus.Delivered,
                        "email.bounced" => NotificationDeliveryStatus.Bounced,
                        "email.failed" => NotificationDeliveryStatus.Failed,
                        _ => delivery.Status,
                    };
                }
            }

            await dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
            return Ok();
        }
    }
}
