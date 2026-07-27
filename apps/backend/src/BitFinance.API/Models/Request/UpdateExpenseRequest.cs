namespace BitFinance.API.Models.Request;

public record UpdateExpenseRequest(
    string Description,
    string Category,
    decimal Amount,
    string Status,
    DateTime? OccurredAt,
    string? Notes = null,
    string? PaymentMethod = null);
