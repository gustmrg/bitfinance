namespace BitFinance.API.Models.Response;

public record BudgetResponse(
    Guid Id,
    Guid OrganizationId,
    decimal Amount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public record OrganizationBudgetResponse(
    Guid Id,
    decimal Amount,
    DateTime CreatedAt,
    DateTime? UpdatedAt);
