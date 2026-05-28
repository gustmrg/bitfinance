using System.Net;

namespace BitFinance.MCP.Services;

public sealed class BitFinanceApiException : Exception
{
    public BitFinanceApiException(HttpStatusCode statusCode, string method, string path, string? responseBody)
        : base(CreateMessage(statusCode, method, path, responseBody))
    {
        StatusCode = statusCode;
        Method = method;
        Path = path;
        ResponseBody = responseBody;
    }

    public HttpStatusCode StatusCode { get; }
    public string Method { get; }
    public string Path { get; }
    public string? ResponseBody { get; }

    private static string CreateMessage(HttpStatusCode statusCode, string method, string path, string? responseBody)
    {
        var message = $"BitFinance API request failed: {method} {path} returned {(int)statusCode} {statusCode}.";
        return string.IsNullOrWhiteSpace(responseBody) ? message : $"{message} Response: {responseBody}";
    }
}
