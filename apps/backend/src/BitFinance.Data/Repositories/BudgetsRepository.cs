using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class BudgetsRepository : IBudgetsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BudgetsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Budget>> GetAllAsync()
    {
        return await _dbContext.Budgets
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Budget?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Budgets
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Id == id);
    }

    public async Task<Budget?> GetByOrganizationIdAsync(Guid organizationId)
    {
        return await _dbContext.Budgets
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.OrganizationId == organizationId);
    }

    public async Task<Budget> CreateAsync(Budget budget)
    {
        _dbContext.Budgets.Add(budget);
        await _dbContext.SaveChangesAsync();
        return budget;
    }

    public async Task UpdateAsync(Budget budget)
    {
        _dbContext.Budgets.Update(budget);
        await _dbContext.SaveChangesAsync();
    }

    public async Task UpdateAsync(Budget budget, params Expression<Func<Budget, object>>[] properties)
    {
        _dbContext.Attach(budget);

        var entry = _dbContext.Entry(budget);

        foreach (var property in properties)
        {
            entry.Property(property).IsModified = true;
        }

        await _dbContext.SaveChangesAsync();
    }

    public async Task<Budget> UpsertByOrganizationIdAsync(Guid organizationId, decimal amount)
    {
        var budget = await _dbContext.Budgets
            .FirstOrDefaultAsync(b => b.OrganizationId == organizationId);

        var now = DateTime.UtcNow;

        if (budget is null)
        {
            budget = new Budget
            {
                Id = Guid.CreateVersion7(),
                OrganizationId = organizationId,
                Amount = amount,
                CreatedAt = now,
                UpdatedAt = null,
            };

            _dbContext.Budgets.Add(budget);
        }
        else
        {
            budget.Amount = amount;
            budget.UpdatedAt = now;
        }

        await _dbContext.SaveChangesAsync();
        return budget;
    }

    public async Task DeleteAsync(Budget budget)
    {
        _dbContext.Budgets.Remove(budget);
        await _dbContext.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
