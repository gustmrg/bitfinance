using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Configurations;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Npgsql;

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

    public async Task<List<BillSeries>> GetAllActiveByOrganizationAsync(Guid organizationId)
    {
        return await _dbContext.Set<BillSeries>()
            .AsNoTracking()
            .Where(s => s.OrganizationId == organizationId && s.IsActive)
            .OrderBy(s => s.StartDate)
            .ToListAsync();
    }

    public async Task<List<BillSeries>> GetAllByOrganizationWithNextBillAsync(Guid organizationId)
    {
        return await _dbContext.Set<BillSeries>()
            .AsNoTracking()
            .Where(s => s.OrganizationId == organizationId)
            .Include(s => s.Bills
                .Where(b => b.Status != BillStatus.Paid && b.Status != BillStatus.Cancelled)
                .OrderBy(b => b.DueDate)
                .Take(1))
            .OrderByDescending(s => s.IsActive)
            .ThenBy(s => s.Bills
                .Where(b => b.Status != BillStatus.Paid && b.Status != BillStatus.Cancelled)
                .Min(b => (DateOnly?)b.DueDate) ?? DateOnly.MaxValue)
            .ThenBy(s => s.Description)
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

    public async Task<bool> TryAddOccurrencesAsync(BillSeries series, List<Bill> bills, int nextOccurrenceNumber)
    {
        var previousOccurrenceNumber = series.NextOccurrenceNumber;
        var previousUpdatedAt = series.UpdatedAt;
        var seriesEntry = _dbContext.Entry(series);
        var wasDetached = seriesEntry.State == EntityState.Detached;

        if (wasDetached)
            _dbContext.Attach(series);

        _dbContext.Set<Bill>().AddRange(bills);
        series.NextOccurrenceNumber = nextOccurrenceNumber;
        series.UpdatedAt = DateTime.UtcNow;
        seriesEntry.Property(s => s.NextOccurrenceNumber).IsModified = true;
        seriesEntry.Property(s => s.UpdatedAt).IsModified = true;

        try
        {
            // One SaveChanges is one transaction: the bills and the series counter are stored together or not at all.
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException exception)
        {
            // Leave nothing pending, so a later save on this context does not retry the failed occurrences.
            foreach (var bill in bills)
            {
                _dbContext.Entry(bill).State = EntityState.Detached;
            }

            series.NextOccurrenceNumber = previousOccurrenceNumber;
            series.UpdatedAt = previousUpdatedAt;
            seriesEntry.State = wasDetached ? EntityState.Detached : EntityState.Unchanged;

            if (IsDuplicateOccurrence(exception))
                return false;

            throw;
        }
    }

    private static bool IsDuplicateOccurrence(DbUpdateException exception)
    {
        return exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation,
            ConstraintName: BillConfiguration.SeriesOccurrenceIndexName
        };
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
