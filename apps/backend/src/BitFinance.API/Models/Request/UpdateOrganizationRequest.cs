using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Request;

public record UpdateOrganizationRequest(
    string Name,
    [property: JsonConverter(typeof(CurrencyCodeConverter))] Currency? Currency = null);

// Accepts only ISO codes as text; the default converter would also take numbers such as 7.
public sealed class CurrencyCodeConverter() : JsonStringEnumConverter<Currency>(allowIntegerValues: false);