using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.ViewModels;

public record OrganizationViewModel(
    Guid Id,
    string Name,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] Currency Currency);