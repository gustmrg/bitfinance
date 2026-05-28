using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class OrganizationsRepository : IOrganizationsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public OrganizationsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Organization>> GetAllAsync()
    {
        return await _dbContext.Set<Organization>()
            .AsNoTracking()
            .ToListAsync();
    }
    
    public async Task<List<Organization>> GetAllByUserIdAsync(string userId)
    {
        return await _dbContext.Set<Organization>()
            .AsNoTracking()
            .Where(x => x.Members.Any(m => m.UserId == userId))
            .ToListAsync();
    }

    public async Task<Organization?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Set<Organization>()
            .Where(x => x.Id == id)
            .Include(x => x.Members)
                .ThenInclude(m => m.User)
            .FirstOrDefaultAsync();
    }

    public async Task<Organization> CreateAsync(Organization organization)
    {
        _dbContext.Set<Organization>().Add(organization);
        await _dbContext.SaveChangesAsync();
        return organization;
    }

    public async Task UpdateAsync(Organization organization)
    {
        _dbContext.Set<Organization>().Update(organization);
        await _dbContext.SaveChangesAsync();
    }

    public Task UpdateAsync(Organization entity, params Expression<Func<Organization, object>>[] properties)
    {
        throw new NotImplementedException();
    }

    public async Task DeleteAsync(Organization organization)
    {
        _dbContext.Set<Organization>().Remove(organization);
        await _dbContext.SaveChangesAsync();
    }
    
    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}