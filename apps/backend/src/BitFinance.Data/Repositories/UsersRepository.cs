using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class UsersRepository : IUsersRepository
{
    private readonly ApplicationDbContext _dbContext;

    public UsersRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<User>> GetAllAsync()
    {
        throw new NotImplementedException();
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _dbContext.Set<User>()
            .Include(u => u.OrganizationMemberships)
                .ThenInclude(m => m.Organization)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User> CreateAsync(User entity)
    {
        throw new NotImplementedException();
    }

    public async Task UpdateAsync(User entity)
    {
        _dbContext.Set<User>().Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task UpdateAsync(User entity, params Expression<Func<User, object>>[] properties)
    {
        throw new NotImplementedException();
    }

    public async Task DeleteAsync(User entity)
    {
        throw new NotImplementedException();
    }
    
    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}