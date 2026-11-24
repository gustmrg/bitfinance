using Microsoft.Extensions.Configuration;

namespace BitFinance.MCP.Configuration;

public sealed class BitFinanceOptions
{
    public Uri ApiBaseUrl { get; init; } = null!;
    public string ApiVersion { get; init; } = "1";

    public static BitFinanceOptions FromConfiguration(IConfiguration configuration)
    {
        var apiBaseUrl = configuration["BITFINANCE_API_BASE_URL"];
        var apiVersion = configuration["BITFINANCE_API_VERSION"];

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

        return new BitFinanceOptions
        {
            ApiBaseUrl = parsedApiBaseUrl,
            ApiVersion = string.IsNullOrWhiteSpace(apiVersion) ? "1" : apiVersion
        };
    }
}
