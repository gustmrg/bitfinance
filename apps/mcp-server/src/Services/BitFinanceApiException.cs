using System.Net;

namespace BitFinance.MCP.Services;

public sealed class BitFinanceApiException : Exception
{
    public BitFinanceApiException(HttpStatusCode statusCode, string method, string path)
        : base(CreateMessage(statusCode, method, SanitizePath(path)))
    {
        StatusCode = statusCode;
        Method = method;
        Path = SanitizePath(path);
    }

    public HttpStatusCode StatusCode { get; }
    public string Method { get; }
    public string Path { get; }
    private static string CreateMessage(HttpStatusCode statusCode, string method, string path)
    {
        // The response body is never included, so give the agent a fixed hint for the two auth failures.
        var hint = statusCode switch
        {
            HttpStatusCode.Unauthorized => " The API key is invalid, revoked or expired.",
            HttpStatusCode.Forbidden => " The API key may not reach this organization or endpoint, or may be read-only there. Call bitfinance_list_organizations to see its organizations and access levels.",
            _ => string.Empty,
        };
        return $"BitFinance API request failed: {method} {path} returned {(int)statusCode} {statusCode}.{hint}";
    }

    private static string SanitizePath(string path)
    {
        var queryIndex = path.IndexOfAny(['?', '#']);
        return queryIndex < 0 ? path : path[..queryIndex];
    }
}
