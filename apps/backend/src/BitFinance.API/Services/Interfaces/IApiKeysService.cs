using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Results;

namespace BitFinance.API.Services.Interfaces;

public interface IApiKeysService
{
    Task<Result<CreatedApiKey>> CreateAsync(
        string userId, string name, IReadOnlyList<ApiKeyScope> organizations, DateTime? expiresAt);

    Task<List<ApiKey>> ListAsync(string userId);

    Task<Result> RevokeAsync(string userId, Guid apiKeyId);

    /// <summary>The usable key matching <paramref name="rawKey"/>, or null.</summary>
    Task<ApiKey?> AuthenticateAsync(string rawKey);

    /// <summary>The key's organizations that its owner is still a member of.</summary>
    Task<List<ApiKeyOrganization>> GetAccessibleOrganizationsAsync(ApiKey apiKey);
}

public sealed record ApiKeyScope(Guid OrganizationId, ApiKeyAccess Access);

public sealed record CreatedApiKey(ApiKey ApiKey, string Secret);
