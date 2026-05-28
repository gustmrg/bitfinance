using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public record UpdateExpenseResponse(
    Guid Id, 
    string Description, 
    [property: JsonConverter(typeof(JsonStringEnumConverter))] ExpenseCategory Category, 
    decimal Amount,
    [property: JsonConverter(typeof(JsonStringEnumConverter))] ExpenseStatus Status,
    DateTimeOffset OccurredAt,
    string CreatedBy);