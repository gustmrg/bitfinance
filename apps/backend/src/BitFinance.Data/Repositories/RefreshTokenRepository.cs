using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class RefreshTokenRepository : IRefreshTokenRepository
{
    private readonly ApplicationDbContext _dbContext;

    public RefreshTokenRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<RefreshToken>> GetAllAsync()
    {
        return await _dbContext.RefreshTokens.ToListAsync();
    }

    public async Task<RefreshToken?> GetByIdAsync(Guid id)
    {
        return await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.Id == id);
    }

    public async Task<RefreshToken?> GetByTokenHashAsync(string tokenHash)
    {
        return await _dbContext.RefreshTokens
            .Include(rt => rt.User)
            .FirstOrDefaultAsync(rt => rt.TokenHash == tokenHash);
    }

    public async Task<List<RefreshToken>> GetActiveTokensByUserIdAsync(string userId)
    {
        return await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId &&
                         !rt.IsRevoked &&
                         rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
    }

    public async Task<List<RefreshToken>> GetTokensByFamilyIdAsync(Guid familyId)
    {
        return await _dbContext.RefreshTokens
            .Where(rt => rt.TokenFamilyId == familyId)
            .OrderBy(rt => rt.CreatedAt)
            .ToListAsync();
    }

    public async Task RevokeTokenFamilyAsync(Guid familyId, string reason)
    {
        await _dbContext.RefreshTokens
            .Where(rt => rt.TokenFamilyId == familyId && !rt.IsRevoked)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(rt => rt.IsRevoked, true)
                .SetProperty(rt => rt.RevokedAt, DateTime.UtcNow)
                .SetProperty(rt => rt.RevokedReason, reason));
    }

    public async Task RevokeAllUserTokensAsync(string userId, string reason)
    {
        await _dbContext.RefreshTokens
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(rt => rt.IsRevoked, true)
                .SetProperty(rt => rt.RevokedAt, DateTime.UtcNow)
                .SetProperty(rt => rt.RevokedReason, reason));
    }

    public async Task<int> CleanupExpiredTokensAsync(DateTime olderThan)
    {
        return await _dbContext.RefreshTokens
            .Where(rt => rt.ExpiresAt < olderThan)
            .ExecuteDeleteAsync();
    }

    public async Task<RefreshToken> CreateAsync(RefreshToken entity)
    {
        await _dbContext.RefreshTokens.AddAsync(entity);
        await _dbContext.SaveChangesAsync();
        return entity;
    }

    public async Task UpdateAsync(RefreshToken entity)
    {
        _dbContext.RefreshTokens.Update(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task UpdateAsync(RefreshToken entity, params Expression<Func<RefreshToken, object>>[] properties)
    {
        var entry = _dbContext.Entry(entity);
        foreach (var property in properties)
        {
            entry.Property(property).IsModified = true;
        }
        await _dbContext.SaveChangesAsync();
    }

    public async Task DeleteAsync(RefreshToken entity)
    {
        _dbContext.RefreshTokens.Remove(entity);
        await _dbContext.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _dbContext.SaveChangesAsync();
    }
}
