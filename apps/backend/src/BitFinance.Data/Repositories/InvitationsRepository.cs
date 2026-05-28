using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class InvitationsRepository : IInvitationsRepository
{
    private readonly ApplicationDbContext _dbContext;

    public InvitationsRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Invitation>> GetAllAsync()
    {
        return await _dbContext.Set<Invitation>()
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Invitation?> GetByIdAsync(Guid id)
    {
        return await _dbContext.Set<Invitation>()
            .FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<Invitation?> GetByTokenHashAsync(string tokenHash)
    {
        return await _dbContext.Set<Invitation>()
            .Include(i => i.Organization)
                .ThenInclude(o => o.Members)
            .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);
    }

    public async Task<Invitation> CreateAsync(Invitation entity)
    {
        _dbContext.Set<Invitation>().Add(entity);
        await _dbContext.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(Invitation entity)
    {
        _dbContext.Set<Invitation>().Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task UpdateAsync(Invitation entity, params Expression<Func<Invitation, object>>[] properties)
    {
        throw new NotImplementedException();
    }

    public async Task DeleteAsync(Invitation entity)
    {
        _dbContext.Set<Invitation>().Remove(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
