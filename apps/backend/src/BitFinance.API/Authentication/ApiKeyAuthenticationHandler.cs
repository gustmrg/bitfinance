using System.Security.Claims;
using System.Text.Encodings.Web;
using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;

namespace BitFinance.API.Authentication;

public class ApiKeyAuthenticationHandler(
    IOptionsMonitor<AuthenticationSchemeOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IApiKeysService apiKeysService)
    : AuthenticationHandler<AuthenticationSchemeOptions>(options, logger, encoder)
{
    public const string SchemeName = "ApiKey";
    private const string BearerPrefix = "Bearer ";

    public static bool HasApiKey(HttpRequest request) => ReadKey(request) is not null;

    protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var rawKey = ReadKey(Request);
        if (rawKey is null)
            return AuthenticateResult.NoResult();

        var apiKey = await apiKeysService.AuthenticateAsync(rawKey);
        if (apiKey is null)
            return AuthenticateResult.Fail("Invalid, revoked or expired API key.");

        Context.Items[typeof(ApiKey)] = apiKey;

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, apiKey.UserId),
            new(ApiKeyClaims.KeyId, apiKey.Id.ToString()),
        };
        claims.AddRange(apiKey.Organizations.Select(scope =>
            new Claim(ApiKeyClaims.Organization, $"{scope.OrganizationId}:{scope.Access}")));

        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, SchemeName));
        return AuthenticateResult.Success(new AuthenticationTicket(principal, SchemeName));
    }

    private static string? ReadKey(HttpRequest request)
    {
        var header = request.Headers.Authorization.ToString();
        if (!header.StartsWith(BearerPrefix, StringComparison.OrdinalIgnoreCase))
            return null;

        var token = header[BearerPrefix.Length..].Trim();
        return token.StartsWith(ApiKeysService.KeyPrefix, StringComparison.Ordinal) ? token : null;
    }
}

public static class ApiKeyClaims
{
    public const string KeyId = "bitfinance:api_key_id";
    public const string Organization = "bitfinance:api_key_organization";

    public static bool IsApiKey(ClaimsPrincipal user) => user.HasClaim(claim => claim.Type == KeyId);

    public static Guid? GetKeyId(ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(KeyId), out var id) ? id : null;

    public static ApiKeyAccess? GetAccess(ClaimsPrincipal user, Guid organizationId)
    {
        var prefix = $"{organizationId}:";
        var value = user.FindAll(Organization).FirstOrDefault(claim => claim.Value.StartsWith(prefix))?.Value;
        return value is not null && Enum.TryParse<ApiKeyAccess>(value[prefix.Length..], out var access)
            ? access
            : null;
    }
}
