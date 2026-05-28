using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IExpensesRepository
{
    Task<int> GetEntriesCountAsync();
    Task<List<Expense>> GetAllAsync(Guid organizationId);
    Task<List<Expense>> GetAllByOrganizationAsync(Guid organizationId, int page, int pageSize, DateTime? startDate = null, DateTime? endDate = null);
    Task<List<Expense>> GetRecentExpenses(Guid organizationId);
    Task<Expense?> GetByIdAsync(Guid expenseId);
    Task<Expense> CreateAsync(Expense expense);
    Task<Expense> UpdateAsync(Expense expense);
    Task DeleteAsync(Expense expense);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
}