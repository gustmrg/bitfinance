using Microsoft.AspNetCore.Http;

namespace BitFinance.MCP.Services;

/// <summary>
/// Sends the calling agent's API key on to the BitFinance API, so each tool call runs as that key's owner.
/// The server holds no credentials of its own.
/// </summary>
public sealed class ForwardApiKeyHandler(IHttpContextAccessor httpContextAccessor) : DelegatingHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        var authorization = httpContextAccessor.HttpContext?.Request.Headers.Authorization.ToString();
        if (!string.IsNullOrEmpty(authorization))
        {
            request.Headers.TryAddWithoutValidation("Authorization", authorization);
        }

        return base.SendAsync(request, cancellationToken);
    }
}
