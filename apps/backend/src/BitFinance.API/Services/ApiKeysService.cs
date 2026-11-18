using System.Security.Cryptography;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Helpers;
using BitFinance.Business.Results;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class ApiKeysService : IApiKeysService
{
    public const string KeyPrefix = "bf_";
    private const int PrefixLength = 11;
    private const int NameMaxLength = 100;
    private static readonly TimeSpan LastUsedPrecision = TimeSpan.FromMinutes(5);

    private readonly IApiKeysRepository _apiKeysRepository;

    public ApiKeysService(IApiKeysRepository apiKeysRepository)
    {
        _apiKeysRepository = apiKeysRepository;
    }

    public async Task<Result<CreatedApiKey>> CreateAsync(
        string userId, string name, IReadOnlyList<ApiKeyScope> organizations, DateTime? expiresAt)
    {
        var trimmedName = name.Trim();
        if (trimmedName.Length is 0 or > NameMaxLength)
            return Error.Invalid($"The name must have between 1 and {NameMaxLength} characters.");

        if (organizations.Count == 0)
            return Error.Invalid("Choose at least one organization.");

        var organizationIds = organizations.Select(scope => scope.OrganizationId).ToList();
        if (organizationIds.Distinct().Count() != organizationIds.Count)
            return Error.Invalid("Each organization can only be listed once.");

        if (organizations.Any(scope => !Enum.IsDefined(scope.Access)))
            return Error.Invalid("Unknown access level.");

        var now = DateTime.UtcNow;
        if (expiresAt is { } expiry && expiry.ToUniversalTime() <= now)
            return Error.Invalid("The expiration date must be in the future.");

        var memberOf = await _apiKeysRepository.GetMemberOrganizationIdsAsync(userId, organizationIds);
        if (memberOf.Count != organizationIds.Count)
            return Error.Invalid("You can only grant access to organizations you are a member of.");

        var secret = KeyPrefix + Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');

        var apiKey = new ApiKey
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = trimmedName,
            Prefix = secret[..PrefixLength],
            KeyHash = TokenHasher.HashToken(secret),
            CreatedAt = now,
            ExpiresAt = expiresAt?.ToUniversalTime(),
            Organizations = organizations
                .Select(scope => new ApiKeyOrganization { OrganizationId = scope.OrganizationId, Access = scope.Access })
                .ToList(),
        };

        await _apiKeysRepository.CreateAsync(apiKey);
        return new CreatedApiKey(apiKey, secret);
    }

    public Task<List<ApiKey>> ListAsync(string userId)
    {
        return _apiKeysRepository.GetUnrevokedByUserIdAsync(userId);
    }

    public async Task<Result> RevokeAsync(string userId, Guid apiKeyId)
    {
        return await _apiKeysRepository.RevokeAsync(apiKeyId, userId, DateTime.UtcNow)
            ? Result.Success()
            : Error.NotFound("API key not found.");
    }

    public async Task<ApiKey?> AuthenticateAsync(string rawKey)
    {
        if (!rawKey.StartsWith(KeyPrefix, StringComparison.Ordinal))
            return null;

        var now = DateTime.UtcNow;
        var apiKey = await _apiKeysRepository.GetUsableByHashAsync(TokenHasher.HashToken(rawKey), now);

        if (apiKey is not null && (apiKey.LastUsedAt is null || now - apiKey.LastUsedAt > LastUsedPrecision))
            await _apiKeysRepository.MarkUsedAsync(apiKey.Id, now);

        return apiKey;
    }

    public async Task<List<ApiKeyOrganization>> GetAccessibleOrganizationsAsync(ApiKey apiKey)
    {
        var organizationIds = apiKey.Organizations.Select(scope => scope.OrganizationId).ToList();
        var memberOf = await _apiKeysRepository.GetMemberOrganizationIdsAsync(apiKey.UserId, organizationIds);

        return apiKey.Organizations
            .Where(scope => memberOf.Contains(scope.OrganizationId))
            .OrderBy(scope => scope.Organization.Name)
            .ToList();
    }
}
