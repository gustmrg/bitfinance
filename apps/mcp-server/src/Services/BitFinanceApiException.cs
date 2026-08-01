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
        return $"BitFinance API request failed: {method} {path} returned {(int)statusCode} {statusCode}.";
    }

    private static string SanitizePath(string path)
    {
        var queryIndex = path.IndexOfAny(['?', '#']);
        return queryIndex < 0 ? path : path[..queryIndex];
    }
}
