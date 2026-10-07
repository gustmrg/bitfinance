using BitFinance.API.Models;
using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Provides operations for querying and creating expenses within an organization.
/// </summary>
public interface IExpensesService
{
    /// <summary>
    /// Retrieves the most recent expenses for the specified organization.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <returns>A list of recent <see cref="Expense"/> entities.</returns>
    Task<List<Expense>> GetRecentExpenses(Guid organizationId, DateTime? from = null, DateTime? to = null);

    /// <summary>
    /// Retrieves the total amount spent for the specified organization and optional period.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <param name="from">Optional start date for occurred-at filtering.</param>
    /// <param name="to">Optional end date for occurred-at filtering.</param>
    /// <returns>The total expense amount.</returns>
    Task<decimal> GetTotalAmountAsync(Guid organizationId, DateTime? from = null, DateTime? to = null);

    /// <summary>
    /// Creates a single expense, enforcing the organization's monthly expense limit.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <param name="data">The validated expense input.</param>
    /// <returns>The created <see cref="Expense"/>, with <see cref="Expense.CreatedByUser"/> populated.</returns>
    /// <exception cref="KeyNotFoundException">The organization or the creating user does not exist.</exception>
    /// <exception cref="PlanLimitExceededException">The monthly expense limit has been reached.</exception>
    Task<Expense> CreateExpenseAsync(Guid organizationId, CreateExpenseData data);

    /// <summary>
    /// Creates multiple expenses atomically, enforcing the organization's monthly
    /// expense limit against the full batch size.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <param name="items">The validated expense inputs.</param>
    /// <returns>The created <see cref="Expense"/> entities, with <see cref="Expense.CreatedByUser"/> populated.</returns>
    /// <exception cref="KeyNotFoundException">The organization or the creating user does not exist.</exception>
    /// <exception cref="PlanLimitExceededException">The batch would exceed the monthly expense limit.</exception>
    Task<List<Expense>> CreateExpensesAsync(Guid organizationId, IReadOnlyList<CreateExpenseData> items);
}
