using System.Text.Json;
using BitFinance.Cli.Errors;
using BitFinance.Cli.Output;

namespace BitFinance.Cli.UnitTests;

public sealed class CliOutputWriterTests
{
    [Fact]
    public void WriteSuccess_Json_WritesSingleCamelCaseValueToStandardOutput()
    {
        using var standardOutput = new StringWriter();
        using var standardError = new StringWriter();
        var writer = new CliOutputWriter(standardOutput, standardError);

        writer.WriteSuccess(new { ItemId = 42, DisplayName = "Budget" }, OutputFormat.Json);

        using var json = JsonDocument.Parse(standardOutput.ToString());
        Assert.Equal(42, json.RootElement.GetProperty("itemId").GetInt32());
        Assert.Equal("Budget", json.RootElement.GetProperty("displayName").GetString());
        Assert.Equal(string.Empty, standardError.ToString());
        Assert.Single(standardOutput.ToString().Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries));
    }

    [Fact]
    public void WriteSuccess_Table_WritesPlainTextTable()
    {
        using var standardOutput = new StringWriter();
        var writer = new CliOutputWriter(standardOutput, TextWriter.Null);

        writer.WriteSuccess(
            new[]
            {
                new { Id = 1, Name = "Primary" },
                new { Id = 2, Name = "Savings" }
            },
            OutputFormat.Table);

        var output = standardOutput.ToString();
        Assert.Contains("id", output);
        Assert.Contains("name", output);
        Assert.Contains("Primary", output);
        Assert.False(output.Contains('\u001b'));
    }

    [Fact]
    public void WriteError_WritesStableEnvelopeOnlyToStandardError()
    {
        using var standardOutput = new StringWriter();
        using var standardError = new StringWriter();
        var writer = new CliOutputWriter(standardOutput, standardError);

        writer.WriteError(new CliError("api_error", "Request failed.", 422));

        using var json = JsonDocument.Parse(standardError.ToString());
        var error = json.RootElement.GetProperty("error");
        Assert.Equal("api_error", error.GetProperty("code").GetString());
        Assert.Equal(422, error.GetProperty("httpStatus").GetInt32());
        Assert.Equal(JsonValueKind.Null, error.GetProperty("details").ValueKind);
        Assert.Equal(string.Empty, standardOutput.ToString());
    }
}
