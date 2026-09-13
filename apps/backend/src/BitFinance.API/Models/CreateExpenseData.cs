using BitFinance.Business.Enums;

namespace BitFinance.API.Models;

/// <summary>
/// Fully validated input for creating an expense, with enums already parsed.
/// Built by the controllers and persisted by <see cref="Services.IExpensesService"/>.
/// </summary>
public record CreateExpenseData(
    string Description,
    ExpenseCategory Category,
    decimal Amount,
    ExpenseStatus Status,
    PaymentMethod? PaymentMethod,
    DateTime OccurredAt,
    string CreatedByUserId,
    string? Notes);
