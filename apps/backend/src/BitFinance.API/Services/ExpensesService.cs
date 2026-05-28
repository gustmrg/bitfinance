using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class ExpensesService : IExpensesService
{
    private readonly IExpensesRepository _expensesRepository;

    public ExpensesService(IExpensesRepository expensesRepository)
    {
        _expensesRepository = expensesRepository;
    }
    
    public List<Expense> GetExpensesByOrganization(Guid organizationId)
    {
        throw new NotImplementedException();
    }

    public Expense GetExpenseById(Guid organizationId, Guid expenseId)
    {
        throw new NotImplementedException();
    }

    public async Task<List<Expense>> GetRecentExpenses(Guid organizationId)
    {
        return await _expensesRepository.GetRecentExpenses(organizationId);
    }

    public Guid CreateExpense(Expense expense)
    {
        throw new NotImplementedException();
    }
}