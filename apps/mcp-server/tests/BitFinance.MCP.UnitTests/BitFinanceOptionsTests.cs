using BitFinance.MCP.Configuration;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public sealed class BitFinanceOptionsTests
{
    [Theory]
    [InlineData("file:///tmp/api")]
    [InlineData("relative/api")]
    [InlineData("not-a-url")]
    public void FromConfiguration_WhenApiUrlIsNotAbsoluteHttp_Throws(string apiBaseUrl)
    {
        var configuration = ValidConfiguration(new Dictionary<string, string?>
        {
            ["BITFINANCE_API_BASE_URL"] = apiBaseUrl
        });

        var exception = Assert.Throws<InvalidOperationException>(
            () => BitFinanceOptions.FromConfiguration(configuration));

        Assert.Contains("absolute HTTP or HTTPS URL", exception.Message);
    }

    [Theory]
    [InlineData("")]
    [InlineData("eyJhbGciOiJIUzI1NiJ9.not-an-api-key")]
    public void FromConfiguration_WhenApiKeyIsMissingOrNotAnApiKey_Throws(string apiKey)
    {
        var configuration = ValidConfiguration(new Dictionary<string, string?>
        {
            ["BITFINANCE_API_KEY"] = apiKey
        });

        var exception = Assert.Throws<InvalidOperationException>(
            () => BitFinanceOptions.FromConfiguration(configuration));

        Assert.Contains("BITFINANCE_API_KEY", exception.Message);
    }

    private static IConfiguration ValidConfiguration(
        IDictionary<string, string?> overrides)
    {
        var values = new Dictionary<string, string?>
        {
            ["BITFINANCE_API_BASE_URL"] = "https://api.example",
            ["BITFINANCE_API_KEY"] = "bf_test-key"
        };

        foreach (var pair in overrides)
        {
            values[pair.Key] = pair.Value;
        }

        return new ConfigurationBuilder()
            .AddInMemoryCollection(values)
            .Build();
    }
}
