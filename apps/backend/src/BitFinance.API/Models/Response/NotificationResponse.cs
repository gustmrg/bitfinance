using System.Text.Json;

namespace BitFinance.API.Models.Response;

public sealed record NotificationResponse(
    Guid Id,
    string Type,
    JsonElement Parameters,
    string ActionPath,
    DateTime CreatedAt,
    DateTime? ReadAt);

public sealed record NotificationUnreadCountResponse(int Count);

public sealed record NotificationPreferenceResponse(bool EmailBillRemindersEnabled, bool EmailAvailable);
