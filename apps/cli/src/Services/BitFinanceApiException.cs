using System.Text.Json;

namespace BitFinance.Cli.Services;

public sealed class BitFinanceApiException : Exception
{
    public BitFinanceApiException(int statusCode, string method, string path, string responseBody)
        : base($"BitFinance API returned HTTP {statusCode} for {method} {path}.")
    {
        StatusCode = statusCode;
        Details = ParseDetails(responseBody);
    }

    public int StatusCode { get; }

    public object? Details { get; }

    private static object? ParseDetails(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(responseBody);
            return document.RootElement.Clone();
        }
        catch (JsonException)
        {
            return responseBody;
        }
    }
}
