using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IExpensesRepository
{
    Task<List<Expense>> GetAllAsync(Guid organizationId);
    Task<(List<Expense> Items, int TotalCount, decimal TotalAmount)> GetAllByOrganizationAsync(
        Guid organizationId,
        int page,
        int pageSize,
        DateTime? startDate = null,
        DateTime? endDate = null,
        ExpenseStatus? status = null,
        string? description = null,
        PaymentMethod? paymentMethod = null);
    Task<List<Expense>> GetRecentExpenses(Guid organizationId, DateTime? startDate = null, DateTime? endDate = null);
    Task<decimal> GetTotalAmountAsync(Guid organizationId, DateTime? startDate = null, DateTime? endDate = null);
    Task<Expense?> GetByIdAsync(Guid expenseId);
    Task<Expense> CreateAsync(Expense expense);
    Task<Expense> UpdateAsync(Expense expense);
    Task DeleteAsync(Expense expense);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
}
