using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models;

public record OrganizationResponseModel(
    Guid Id,
    string Name,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] PlanTier PlanTier);
