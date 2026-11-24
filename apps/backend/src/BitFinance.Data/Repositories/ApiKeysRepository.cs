using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.Data.Repositories;

public class ApiKeysRepository : IApiKeysRepository
{
    private readonly ApplicationDbContext _dbContext;

    public ApiKeysRepository(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task CreateAsync(ApiKey apiKey)
    {
        _dbContext.ApiKeys.Add(apiKey);
        await _dbContext.SaveChangesAsync();
    }

    public async Task<List<ApiKey>> GetUnrevokedByUserIdAsync(string userId)
    {
        return await _dbContext.ApiKeys
            .AsNoTracking()
            .Include(key => key.Organizations)
            .ThenInclude(scope => scope.Organization)
            .Where(key => key.UserId == userId && key.RevokedAt == null)
            .OrderByDescending(key => key.CreatedAt)
            .ToListAsync();
    }

    public async Task<ApiKey?> GetUsableByHashAsync(string keyHash, DateTime now)
    {
        return await _dbContext.ApiKeys
            .AsNoTracking()
            .Include(key => key.Organizations)
            .ThenInclude(scope => scope.Organization)
            .FirstOrDefaultAsync(key =>
                key.KeyHash == keyHash
                && key.RevokedAt == null
                && (key.ExpiresAt == null || key.ExpiresAt > now));
    }

    public async Task<bool> RevokeAsync(Guid apiKeyId, string userId, DateTime now)
    {
        var revoked = await _dbContext.ApiKeys
            .Where(key => key.Id == apiKeyId && key.UserId == userId && key.RevokedAt == null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(key => key.RevokedAt, now));

        return revoked == 1;
    }

    public async Task MarkUsedAsync(Guid apiKeyId, DateTime now)
    {
        await _dbContext.ApiKeys
            .Where(key => key.Id == apiKeyId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(key => key.LastUsedAt, now));
    }

    public async Task<HashSet<Guid>> GetMemberOrganizationIdsAsync(string userId, IReadOnlyCollection<Guid> organizationIds)
    {
        var memberOf = await _dbContext.OrganizationMembers
            .Where(member => member.UserId == userId && organizationIds.Contains(member.OrganizationId))
            .Select(member => member.OrganizationId)
            .ToListAsync();

        return memberOf.ToHashSet();
    }
}
