using System.Text.Json;
using BitFinance.Cli.Errors;

namespace BitFinance.Cli.UnitTests;

public sealed class CliApplicationTests
{
    [Fact]
    public async Task RunAsync_Help_DoesNotRequireEnvironmentConfiguration()
    {
        using var standardOutput = new StringWriter();
        using var standardError = new StringWriter();
        var application = new CliApplication(
            new DictionaryEnvironment(new Dictionary<string, string?>()),
            standardOutput,
            standardError);

        var exitCode = await application.RunAsync(["--help"]);

        Assert.Equal(ExitCodes.Success, exitCode);
        Assert.Contains("Agent-oriented command-line client", standardOutput.ToString());
        Assert.Equal(string.Empty, standardError.ToString());
    }

    [Fact]
    public async Task RunAsync_InvalidOutputFormat_WritesStructuredParseError()
    {
        using var standardOutput = new StringWriter();
        using var standardError = new StringWriter();
        var application = new CliApplication(
            new DictionaryEnvironment(new Dictionary<string, string?>()),
            standardOutput,
            standardError);

        var exitCode = await application.RunAsync(["--output", "yaml"]);

        Assert.Equal(ExitCodes.InvalidInput, exitCode);
        Assert.Equal(string.Empty, standardOutput.ToString());
        using var json = JsonDocument.Parse(standardError.ToString());
        Assert.Equal("invalid_arguments", json.RootElement.GetProperty("error").GetProperty("code").GetString());
    }
}
