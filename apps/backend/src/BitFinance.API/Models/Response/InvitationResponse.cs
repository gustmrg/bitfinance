using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public record InvitationResponse(
    Guid Id,
    string Email,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] OrgRole Role,
    string? InvitedBy,
    DateTime CreatedAt,
    DateTime ExpiresAt);
