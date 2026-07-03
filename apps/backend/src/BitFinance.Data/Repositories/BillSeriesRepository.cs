using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class BillSeriesRepository : IBillSeriesRepository
{
    private readonly ApplicationDbContext _dbContext;

    public BillSeriesRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<BillSeries>> GetAllAsync()
    {
        return await _dbContext.Set<BillSeries>()
            .AsNoTracking()
            .OrderBy(s => s.StartDate)
            .ToListAsync();
    }

    public async Task<List<BillSeries>> GetAllActiveAsync()
    {
        return await _dbContext.Set<BillSeries>()
            .AsNoTracking()
            .Where(s => s.IsActive)
            .OrderBy(s => s.StartDate)
            .ToListAsync();
    }

    public async Task<List<BillSeries>> GetAllActiveByOrganizationAsync(Guid organizationId)
    {
        return await _dbContext.Set<BillSeries>()
            .AsNoTracking()
            .Where(s => s.OrganizationId == organizationId && s.IsActive)
            .OrderBy(s => s.StartDate)
            .ToListAsync();
    }

    public async Task<BillSeries?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Set<BillSeries>()
            .FirstOrDefaultAsync(s => s.Id == id);
    }

    public async Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc)
    {
        return await _dbContext.Set<BillSeries>()
            .CountAsync(s => s.OrganizationId == organizationId
                          && s.CreatedAt >= monthStartUtc
                          && s.CreatedAt < monthEndUtc);
    }

    public async Task<BillSeries> CreateAsync(BillSeries series)
    {
        _dbContext.Set<BillSeries>().Add(series);
        await _dbContext.SaveChangesAsync();
        return series;
    }

    public async Task UpdateAsync(BillSeries series)
    {
        _dbContext.Set<BillSeries>().Update(series);
        await _dbContext.SaveChangesAsync();
    }

    public async Task UpdateAsync(BillSeries series, params Expression<Func<BillSeries, object>>[] properties)
    {
        _dbContext.Attach(series);

        var entry = _dbContext.Entry(series);

        foreach (var property in properties)
        {
            entry.Property(property).IsModified = true;
        }

        series.UpdatedAt = DateTime.UtcNow;
        entry.Property(x => x.UpdatedAt).IsModified = true;

        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteAsync(BillSeries series)
    {
        _dbContext.Set<BillSeries>().Remove(series);
        await _dbContext.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
