using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class ExpensesRepository : IExpensesRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ExpensesRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Expense>> GetAllAsync(Guid organizationId)
    {
        return await _dbContext.Set<Expense>()
            .AsNoTracking()
            .Where(b => b.OrganizationId == organizationId)
            .ToListAsync();
    }
    
    public async Task<List<Expense>> GetAllByOrganizationAsync(Guid organizationId, int page, int pageSize, DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _dbContext.Set<Expense>()
            .AsNoTracking()
            .Where(b => b.OrganizationId == organizationId);

        if (startDate.HasValue)
        {
            query = query.Where(e => e.CreatedAt >= startDate);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.CreatedAt <= endDate);
        }
        
        return await query
            .Include(e => e.CreatedByUser)
            .Include(e => e.Attachments)
            .OrderBy(e => e.CreatedAt)
            .Skip(pageSize * (page - 1))
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task<List<Expense>> GetRecentExpenses(Guid organizationId)
    {
        return await _dbContext.Set<Expense>()
            .AsNoTracking()
            .Where(b => b.OrganizationId == organizationId)
            .OrderByDescending(e => e.OccurredAt)
            .ToListAsync();
    }

    public async Task<Expense?> GetByIdAsync(Guid expenseId)
    {
        return await _dbContext.Set<Expense>()
            .Include(e => e.CreatedByUser)
            .Include(e => e.Attachments)
            .Where(e => e.Id == expenseId)
            .FirstOrDefaultAsync();
    }

    public async Task<Expense> CreateAsync(Expense expense)
    {
        _dbContext.Set<Expense>().Add(expense);
        await _dbContext.SaveChangesAsync();
        return expense;
    }

    public async Task<Expense> UpdateAsync(Expense expense)
    {
        _dbContext.Set<Expense>().Update(expense);
        await _dbContext.SaveChangesAsync();
        return expense;
    }

    public async Task DeleteAsync(Expense expense)
    {
        _dbContext.Set<Expense>().Remove(expense);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<int> GetEntriesCountAsync()
    {
        return await _dbContext.Expenses.CountAsync();
    }

    public async Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc)
    {
        return await _dbContext.Expenses
            .CountAsync(e => e.OrganizationId == organizationId
                          && e.CreatedAt >= monthStartUtc
                          && e.CreatedAt < monthEndUtc);
    }
}