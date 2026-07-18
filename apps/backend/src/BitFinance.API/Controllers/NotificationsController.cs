using System.Security.Claims;
using Asp.Versioning;
using BitFinance.API.Attributes;
using BitFinance.API.Models;
using BitFinance.API.Models.Request;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[OrganizationAuthorization]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organizations/{organizationId:guid}")]
public sealed class NotificationsController(INotificationService notificationService) : ControllerBase
{
    [HttpGet("notifications")]
    public async Task<ActionResult<PagedResponse<NotificationResponse>>> GetNotifications(
        Guid organizationId,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await notificationService.GetAsync(
            organizationId, userId, page, pageSize, unreadOnly, cancellationToken));
    }

    [HttpGet("notifications/unread-count")]
    public async Task<ActionResult<NotificationUnreadCountResponse>> GetUnreadCount(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        var count = await notificationService.GetUnreadCountAsync(organizationId, userId, cancellationToken);
        return Ok(new NotificationUnreadCountResponse(count));
    }

    [HttpPatch("notifications/{notificationId:guid}/read")]
    public async Task<IActionResult> MarkRead(Guid organizationId, Guid notificationId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        return await notificationService.MarkReadAsync(
            organizationId, userId, notificationId, cancellationToken) ? NoContent() : NotFound();
    }

    [HttpPost("notifications/read-all")]
    public async Task<IActionResult> MarkAllRead(Guid organizationId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        await notificationService.MarkAllReadAsync(organizationId, userId, cancellationToken);
        return NoContent();
    }

    [HttpGet("notification-preferences")]
    public async Task<ActionResult<NotificationPreferenceResponse>> GetPreferences(
        Guid organizationId,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await notificationService.GetPreferencesAsync(organizationId, userId, cancellationToken));
    }

    [HttpPut("notification-preferences")]
    public async Task<ActionResult<NotificationPreferenceResponse>> UpdatePreferences(
        Guid organizationId,
        [FromBody] UpdateNotificationPreferenceRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId is null) return Unauthorized();
        return Ok(await notificationService.UpdatePreferencesAsync(
            organizationId, userId, request.EmailBillRemindersEnabled, cancellationToken));
    }

    private string? GetUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
}
