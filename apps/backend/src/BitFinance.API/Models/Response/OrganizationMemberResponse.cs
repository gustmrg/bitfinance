using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public record OrganizationMemberResponse(
    string Id,
    string Username,
    string Email,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] OrgRole Role,
    DateTime JoinedAt);
