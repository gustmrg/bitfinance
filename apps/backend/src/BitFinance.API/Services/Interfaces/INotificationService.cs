using BitFinance.API.Models;
using BitFinance.API.Models.Response;
using BitFinance.Business.Enums;

namespace BitFinance.API.Services.Interfaces;

public interface INotificationService
{
    Task EnqueueAsync(Guid organizationId, NotificationType type, string? aggregateId, string deduplicationKey,
        NotificationEventPayload payload, CancellationToken cancellationToken = default);
    Task<PagedResponse<NotificationResponse>> GetAsync(Guid organizationId, string userId, int page, int pageSize,
        bool unreadOnly, CancellationToken cancellationToken = default);
    Task<int> GetUnreadCountAsync(Guid organizationId, string userId, CancellationToken cancellationToken = default);
    Task<bool> MarkReadAsync(Guid organizationId, string userId, Guid notificationId,
        CancellationToken cancellationToken = default);
    Task MarkAllReadAsync(Guid organizationId, string userId, CancellationToken cancellationToken = default);
    Task<NotificationPreferenceResponse> GetPreferencesAsync(Guid organizationId, string userId,
        CancellationToken cancellationToken = default);
    Task<NotificationPreferenceResponse> UpdatePreferencesAsync(Guid organizationId, string userId, bool enabled,
        CancellationToken cancellationToken = default);
}

public sealed record NotificationEventPayload(
    Guid? BillId = null,
    string? BillDescription = null,
    decimal? AmountDue = null,
    DateOnly? DueDate = null,
    string? MemberUserId = null,
    string? MemberName = null,
    string? ActorName = null,
    string? PreviousRole = null,
    string? NewRole = null);
