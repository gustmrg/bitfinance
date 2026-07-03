using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Request;

public record UpdateMemberRoleRequest(
    [property: JsonConverter(typeof(JsonStringEnumConverter))] OrgRole Role);
