using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
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
    
    public async Task<(List<Expense> Items, int TotalCount, decimal TotalAmount)> GetAllByOrganizationAsync(
        Guid organizationId,
        int page,
        int pageSize,
        DateTime? startDate = null,
        DateTime? endDate = null,
        ExpenseStatus? status = null,
        string? description = null,
        PaymentMethod? paymentMethod = null)
    {
        var query = _dbContext.Set<Expense>()
            .AsNoTracking()
            .Where(b => b.OrganizationId == organizationId);

        if (startDate.HasValue)
        {
            query = query.Where(e => e.OccurredAt >= startDate);
        }

        if (endDate.HasValue)
        {
            query = query.Where(e => e.OccurredAt <= endDate);
        }

        if (status.HasValue)
        {
            query = query.Where(e => e.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(description))
        {
            var term = description.Trim();
            query = query.Where(e => EF.Functions.ILike(e.Description, $"%{term}%"));
        }

        if (paymentMethod.HasValue)
        {
            query = query.Where(e => e.PaymentMethod == paymentMethod);
        }

        var summary = await query
            .GroupBy(_ => 1)
            .Select(group => new
            {
                TotalCount = group.Count(),
                TotalAmount = group.Sum(expense => expense.Amount)
            })
            .FirstOrDefaultAsync();

        var items = await query
            .Include(e => e.CreatedByUser)
            .Include(e => e.Attachments)
            .OrderBy(e => e.CreatedAt)
            .Skip(pageSize * (page - 1))
            .Take(pageSize)
            .ToListAsync();

        return (items, summary?.TotalCount ?? 0, summary?.TotalAmount ?? 0);
    }

    public async Task<List<Expense>> GetRecentExpenses(Guid organizationId, DateTime? startDate = null, DateTime? endDate = null)
    {
        return await BuildDashboardExpensesQuery(organizationId, startDate, endDate)
            .OrderByDescending(e => e.OccurredAt)
            .ToListAsync();
    }

    public async Task<decimal> GetTotalAmountAsync(Guid organizationId, DateTime? startDate = null, DateTime? endDate = null)
    {
        return await BuildDashboardExpensesQuery(organizationId, startDate, endDate)
            .SumAsync(e => e.Amount);
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

    public async Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc)
    {
        return await _dbContext.Expenses
            .CountAsync(e => e.OrganizationId == organizationId
                          && e.CreatedAt >= monthStartUtc
                          && e.CreatedAt < monthEndUtc);
    }

    private IQueryable<Expense> BuildDashboardExpensesQuery(Guid organizationId, DateTime? startDate, DateTime? endDate)
    {
        var query = _dbContext.Set<Expense>()
            .AsNoTracking()
            .Where(expense => expense.OrganizationId == organizationId);

        if (startDate.HasValue)
        {
            query = query.Where(expense => expense.OccurredAt >= startDate.Value);
        }

        if (endDate.HasValue)
        {
            query = query.Where(expense => expense.OccurredAt <= endDate.Value);
        }

        return query;
    }
}
