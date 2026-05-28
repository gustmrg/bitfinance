using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Caching;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace BitFinance.Data.Repositories;

public class BillsRepository : IBillsRepository
{
    private readonly IConfiguration _configuration;
    private readonly ApplicationDbContext _dbContext;
    private readonly ICacheService _cache;

    public BillsRepository(IConfiguration configuration, ApplicationDbContext dbContext, ICacheService cache)
    {
        _configuration = configuration;
        _dbContext = dbContext;
        _cache = cache;
    }

    public async Task<List<Bill>> GetAllAsync()
    {
        List<Bill> list = await _dbContext.Set<Bill>()
            .AsNoTracking()
            .Include(b => b.Attachments)
            .OrderBy(b => b.DueDate)
            .ToListAsync();

        return list;
    }
    
    public async Task<(List<Bill> Items, int TotalCount)> GetAllByOrganizationAsync(Guid organizationId, int page, int pageSize,
        DateTime? startDate = null, DateTime? endDate = null,
        List<BillStatus>? statuses = null, string? description = null)
    {
        var query = _dbContext.Set<Bill>()
            .AsNoTracking()
            .Where(b => b.OrganizationId == organizationId);

        if (startDate.HasValue)
        {
            query = query.Where(b => b.DueDate >= DateOnly.FromDateTime(startDate.Value));
        }

        if (endDate.HasValue)
        {
            query = query.Where(b => b.DueDate <= DateOnly.FromDateTime(endDate.Value));
        }

        if (statuses is { Count: > 0 })
        {
            query = query.Where(b => statuses.Contains(b.Status));
        }

        if (!string.IsNullOrWhiteSpace(description))
        {
            query = query.Where(b => EF.Functions.ILike(b.Description, $"%{description}%"));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .Include(b => b.Attachments)
            .OrderBy(b => b.DueDate)
            .Skip(pageSize * (page - 1))
            .Take(pageSize)
            .ToListAsync();

        return (items, totalCount);
    }
    
    public async Task<List<Bill>> GetAllByStatusAsync(BillStatus billStatus)
    {
        List<Bill> list = await _dbContext.Set<Bill>()
            .AsNoTracking()
            .Where(b => b.Status == billStatus)
            .Include(b => b.Attachments)
            .OrderBy(b => b.DueDate)
            .ToListAsync();

        return list;
    }

    public async Task<List<Bill>> GetAllByOrganizationAndStatusAsync(Guid organizationId, BillStatus billStatus)
    {
        return await _dbContext.Bills.AsNoTracking()
            .Where(b => b.OrganizationId == organizationId && b.Status == billStatus)
            .ToListAsync();
    }

    public async Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc)
    {
        return await _dbContext.Bills
            .CountAsync(b => b.OrganizationId == organizationId
                          && b.CreatedAt >= monthStartUtc
                          && b.CreatedAt < monthEndUtc);
    }

    public async Task<Bill?> GetByIdAsync(Guid id)
    {
        Bill? bill;
        
        if (IsCacheEnabled())
        {
            string key = _cache.GenerateKey<Bill>(id.ToString());
            bill = await _cache.GetAsync<Bill>(key);

            if (bill is null)
            {
                bill = await _dbContext.Set<Bill>()
                    .Include(b => b.Attachments)
                    .FirstOrDefaultAsync(x => x.Id == id);

                if (bill is not null)
                {
                    await _cache.SetAsync(key, bill);
                }
            }
        }
        else
        {
            bill = await _dbContext.Set<Bill>()
                .Include(b => b.Attachments)
                .FirstOrDefaultAsync(x => x.Id == id);
        }
        
        return bill;
    }

    public async Task<List<Bill>> GetUpcomingBills(Guid organizationId)
    {
        return await _dbContext.Set<Bill>()
            .AsNoTracking()
            .Where(x => x.OrganizationId == organizationId &&
                        (x.Status == BillStatus.Upcoming || x.Status == BillStatus.Due))
            .OrderByDescending(x => x.DueDate)
            .ToListAsync();
    }

    public async Task UpdateRangeAsync(List<Bill> bills)
    {
        if (bills.Count == 0)
            return;
        
        _dbContext.Bills.UpdateRange(bills);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<Bill> CreateAsync(Bill bill)
    {
        _dbContext.Set<Bill>().Add(bill);
        await _dbContext.SaveChangesAsync();

        if (IsCacheEnabled())
        {
            string key = _cache.GenerateKey<Bill>(bill.Id.ToString());
            await _cache.SetAsync(key, bill, TimeSpan.FromHours(1));
        }

        return bill;
    }

    public async Task UpdateAsync(Bill bill)
    {
        _dbContext.Set<Bill>().Update(bill);
        await _dbContext.SaveChangesAsync();
        
        if (IsCacheEnabled())
        {
            string key = _cache.GenerateKey<Bill>(bill.Id.ToString());
            await _cache.SetAsync(key, bill);
        }
    }

    public async Task UpdateAsync(Bill bill, params Expression<Func<Bill, object>>[] properties)
    {
        _dbContext.Attach(bill);
        
        var entry = _dbContext.Entry(bill);

        foreach (var property in properties)
        {
            entry.Property(property).IsModified = true;
        }
        
        bill.UpdatedAt = DateTime.UtcNow;
        entry.Property(x => x.UpdatedAt).IsModified = true;
        
        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteAsync(Bill bill)
    {
        _dbContext.Set<Bill>().Remove(bill);
        await _dbContext.SaveChangesAsync();

        if (IsCacheEnabled())
        {
            string key = _cache.GenerateKey<Bill>(bill.Id.ToString());
            await _cache.RemoveAsync(key);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }

    private bool IsCacheEnabled()
    {
        return Convert.ToBoolean(_configuration.GetSection("AppSettings:CacheEnabled").Value);
    }
}