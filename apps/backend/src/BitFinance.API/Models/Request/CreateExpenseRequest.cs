namespace BitFinance.API.Models.Request;

public record CreateExpenseRequest(string Description, string Category, decimal Amount, string Status, DateTime? OccurredAt, string CreatedBy);