using BitFinance.Cli.Errors;
using System.Globalization;

namespace BitFinance.Cli.Configuration;

public sealed record CliConfiguration(Uri ApiBaseUrl, string AccessToken, string ApiVersion)
{
    public const string ApiBaseUrlVariable = "BITFINANCE_API_BASE_URL";
    public const string AccessTokenVariable = "BITFINANCE_ACCESS_TOKEN";
    public const string ApiVersionVariable = "BITFINANCE_API_VERSION";

    public static CliConfiguration Load(IEnvironmentVariables environment)
    {
        ArgumentNullException.ThrowIfNull(environment);

        var apiBaseUrlValue = GetRequired(environment, ApiBaseUrlVariable);
        var accessToken = GetRequired(environment, AccessTokenVariable);
        var apiVersionValue = environment.Get(ApiVersionVariable);

        if (!Uri.TryCreate(apiBaseUrlValue, UriKind.Absolute, out var apiBaseUrl)
            || (apiBaseUrl.Scheme != Uri.UriSchemeHttp && apiBaseUrl.Scheme != Uri.UriSchemeHttps))
        {
            throw CliException.Configuration($"{ApiBaseUrlVariable} must be an absolute HTTP or HTTPS URL.");
        }

        var apiVersion = string.IsNullOrWhiteSpace(apiVersionValue) ? "1" : apiVersionValue.Trim();
        if (!int.TryParse(apiVersion, NumberStyles.None, CultureInfo.InvariantCulture, out var parsedVersion)
            || parsedVersion < 1)
        {
            throw CliException.Configuration($"{ApiVersionVariable} must be a positive integer when provided.");
        }

        return new CliConfiguration(apiBaseUrl, accessToken, apiVersion);
    }

    private static string GetRequired(IEnvironmentVariables environment, string name)
    {
        var value = environment.Get(name);
        if (string.IsNullOrWhiteSpace(value))
        {
            throw CliException.Configuration($"{name} is required.");
        }

        return value.Trim();
    }
}
