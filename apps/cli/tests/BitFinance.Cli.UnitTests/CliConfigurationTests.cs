using BitFinance.Cli.Configuration;
using BitFinance.Cli.Errors;

namespace BitFinance.Cli.UnitTests;

public sealed class CliConfigurationTests
{
    [Fact]
    public void Load_ValidEnvironment_ReturnsConfiguration()
    {
        var environment = new DictionaryEnvironment(new Dictionary<string, string?>
        {
            [CliConfiguration.ApiBaseUrlVariable] = "https://api.example.com/",
            [CliConfiguration.AccessTokenVariable] = "test-token",
            [CliConfiguration.ApiVersionVariable] = "2"
        });

        var configuration = CliConfiguration.Load(environment);

        Assert.Equal(new Uri("https://api.example.com/"), configuration.ApiBaseUrl);
        Assert.Equal("test-token", configuration.AccessToken);
        Assert.Equal("2", configuration.ApiVersion);
    }

    [Fact]
    public void Load_OmittedApiVersion_DefaultsToOne()
    {
        var environment = ValidEnvironment();

        var configuration = CliConfiguration.Load(environment);

        Assert.Equal("1", configuration.ApiVersion);
    }

    [Theory]
    [InlineData(CliConfiguration.ApiBaseUrlVariable)]
    [InlineData(CliConfiguration.AccessTokenVariable)]
    public void Load_MissingRequiredValue_ThrowsStructuredConfigurationException(string missingVariable)
    {
        var values = new Dictionary<string, string?>
        {
            [CliConfiguration.ApiBaseUrlVariable] = "https://api.example.com",
            [CliConfiguration.AccessTokenVariable] = "test-token"
        };
        values.Remove(missingVariable);

        var exception = Assert.Throws<CliException>(() =>
            CliConfiguration.Load(new DictionaryEnvironment(values)));

        Assert.Equal(ExitCodes.InvalidInput, exception.ExitCode);
        Assert.Equal("invalid_configuration", exception.Error.Code);
        Assert.Contains(missingVariable, exception.Error.Message);
    }

    [Theory]
    [InlineData("api.example.com")]
    [InlineData("file:///tmp/bitfinance")]
    public void Load_InvalidApiUrl_ThrowsConfigurationException(string value)
    {
        var environment = ValidEnvironment(new Dictionary<string, string?>
        {
            [CliConfiguration.ApiBaseUrlVariable] = value
        });

        var exception = Assert.Throws<CliException>(() => CliConfiguration.Load(environment));

        Assert.Equal("invalid_configuration", exception.Error.Code);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("v1")]
    [InlineData("1.0")]
    public void Load_InvalidApiVersion_ThrowsConfigurationException(string value)
    {
        var environment = ValidEnvironment(new Dictionary<string, string?>
        {
            [CliConfiguration.ApiVersionVariable] = value
        });

        var exception = Assert.Throws<CliException>(() => CliConfiguration.Load(environment));

        Assert.Equal("invalid_configuration", exception.Error.Code);
    }

    private static DictionaryEnvironment ValidEnvironment(Dictionary<string, string?>? overrides = null)
    {
        var values = new Dictionary<string, string?>
        {
            [CliConfiguration.ApiBaseUrlVariable] = "https://api.example.com",
            [CliConfiguration.AccessTokenVariable] = "test-token"
        };

        if (overrides is not null)
        {
            foreach (var item in overrides)
            {
                values[item.Key] = item.Value;
            }
        }

        return new DictionaryEnvironment(values);
    }
}

internal sealed class DictionaryEnvironment(IReadOnlyDictionary<string, string?> values) : IEnvironmentVariables
{
    public string? Get(string name) => values.GetValueOrDefault(name);
}
