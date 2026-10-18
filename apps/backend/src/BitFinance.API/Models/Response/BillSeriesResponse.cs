using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public record BillSeriesResponse(
    Guid Id,
    string Description,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] BillCategory Category,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] Frequency Frequency,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] BillSeriesType Type,
    decimal AmountDue,
    DateOnly StartDate,
    int? TotalOccurrences,
    int GeneratedOccurrences,
    bool IsActive,
    DateTime? StoppedAt,
    Guid? NextBillId,
    DateOnly? NextDueDate);
