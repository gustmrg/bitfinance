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
    [InlineData("BITFINANCE_AGENT_EMAIL")]
    [InlineData("BITFINANCE_AGENT_PASSWORD")]
    public void FromConfiguration_WhenCredentialIsMissing_Throws(string missingKey)
    {
        var configuration = ValidConfiguration(new Dictionary<string, string?>
        {
            [missingKey] = ""
        });

        var exception = Assert.Throws<InvalidOperationException>(
            () => BitFinanceOptions.FromConfiguration(configuration));

        Assert.Contains(missingKey, exception.Message);
    }

    private static IConfiguration ValidConfiguration(
        IDictionary<string, string?> overrides)
    {
        var values = new Dictionary<string, string?>
        {
            ["BITFINANCE_API_BASE_URL"] = "https://api.example",
            ["BITFINANCE_AGENT_EMAIL"] = "agent@example.test",
            ["BITFINANCE_AGENT_PASSWORD"] = "test-password"
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
