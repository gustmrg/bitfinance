using Microsoft.Extensions.Configuration;

namespace BitFinance.MCP.Configuration;

public sealed class BitFinanceOptions
{
    public Uri ApiBaseUrl { get; init; } = null!;
    public string ApiKey { get; init; } = string.Empty;
    public Guid? DefaultOrganizationId { get; init; }
    public string ApiVersion { get; init; } = "1";

    public static BitFinanceOptions FromConfiguration(IConfiguration configuration)
    {
        var apiBaseUrl = configuration["BITFINANCE_API_BASE_URL"];
        var apiKey = configuration["BITFINANCE_API_KEY"];
        var apiVersion = configuration["BITFINANCE_API_VERSION"];
        var defaultOrganizationIdValue = configuration["BITFINANCE_DEFAULT_ORGANIZATION_ID"];

        if (string.IsNullOrWhiteSpace(apiBaseUrl))
        {
            throw new InvalidOperationException("BITFINANCE_API_BASE_URL is required.");
        }

        if (!Uri.TryCreate(apiBaseUrl, UriKind.Absolute, out var parsedApiBaseUrl)
            || (parsedApiBaseUrl.Scheme != Uri.UriSchemeHttp
                && parsedApiBaseUrl.Scheme != Uri.UriSchemeHttps))
        {
            throw new InvalidOperationException("BITFINANCE_API_BASE_URL must be an absolute HTTP or HTTPS URL.");
        }

        if (string.IsNullOrWhiteSpace(apiKey) || !apiKey.StartsWith("bf_", StringComparison.Ordinal))
        {
            throw new InvalidOperationException("BITFINANCE_API_KEY is required and must be a BitFinance API key (bf_...).");
        }

        Guid? defaultOrganizationId = null;
        if (!string.IsNullOrWhiteSpace(defaultOrganizationIdValue))
        {
            if (!Guid.TryParse(defaultOrganizationIdValue, out var parsedOrganizationId))
            {
                throw new InvalidOperationException("BITFINANCE_DEFAULT_ORGANIZATION_ID must be a valid GUID when provided.");
            }

            defaultOrganizationId = parsedOrganizationId;
        }

        return new BitFinanceOptions
        {
            ApiBaseUrl = parsedApiBaseUrl,
            ApiKey = apiKey,
            DefaultOrganizationId = defaultOrganizationId,
            ApiVersion = string.IsNullOrWhiteSpace(apiVersion) ? "1" : apiVersion
        };
    }
}
