using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IApiKeysRepository
{
    Task CreateAsync(ApiKey apiKey);

    /// <summary>Keys the user has not revoked, expired ones included, with their organizations.</summary>
    Task<List<ApiKey>> GetUnrevokedByUserIdAsync(string userId);

    /// <summary>The key with this hash if it is neither revoked nor expired.</summary>
    Task<ApiKey?> GetUsableByHashAsync(string keyHash, DateTime now);

    Task<bool> RevokeAsync(Guid apiKeyId, string userId, DateTime now);

    Task MarkUsedAsync(Guid apiKeyId, DateTime now);

    /// <summary>The subset of <paramref name="organizationIds"/> the user is a member of.</summary>
    Task<HashSet<Guid>> GetMemberOrganizationIdsAsync(string userId, IReadOnlyCollection<Guid> organizationIds);
}
