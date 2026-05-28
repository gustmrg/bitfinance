using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Provides operations for querying and managing expenses within an organization.
/// </summary>
public interface IExpensesService
{
    /// <summary>
    /// Retrieves all expenses for the specified organization.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <returns>A list of <see cref="Expense"/> entities.</returns>
    List<Expense> GetExpensesByOrganization(Guid organizationId);

    /// <summary>
    /// Retrieves a specific expense by its ID within an organization.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <param name="expenseId">The ID of the expense.</param>
    /// <returns>The matching <see cref="Expense"/> entity.</returns>
    Expense GetExpenseById(Guid organizationId, Guid expenseId);

    /// <summary>
    /// Retrieves the most recent expenses for the specified organization.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <returns>A list of recent <see cref="Expense"/> entities.</returns>
    Task<List<Expense>> GetRecentExpenses(Guid organizationId);

    /// <summary>
    /// Creates a new expense record.
    /// </summary>
    /// <param name="expense">The expense entity to create.</param>
    /// <returns>The ID of the newly created expense.</returns>
    Guid CreateExpense(Expense expense);
}
