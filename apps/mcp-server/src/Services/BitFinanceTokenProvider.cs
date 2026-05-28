using System.Net.Http.Json;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Models;
using Microsoft.Extensions.Logging;

namespace BitFinance.MCP.Services;

public sealed class BitFinanceTokenProvider : IBitFinanceTokenProvider
{
    private static readonly TimeSpan RefreshSkew = TimeSpan.FromMinutes(5);

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BitFinanceOptions _options;
    private readonly ILogger<BitFinanceTokenProvider> _logger;
    private readonly SemaphoreSlim _loginLock = new(1, 1);

    private AuthenticationResponse? _currentAuthentication;

    public BitFinanceTokenProvider(
        IHttpClientFactory httpClientFactory,
        BitFinanceOptions options,
        ILogger<BitFinanceTokenProvider> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public async Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default)
    {
        var authentication = await GetAuthenticationAsync(cancellationToken);
        return authentication.AccessToken;
    }

    public async Task<string> GetAgentUserIdAsync(CancellationToken cancellationToken = default)
    {
        var authentication = await GetAuthenticationAsync(cancellationToken);
        return authentication.User.Id;
    }

    private async Task<AuthenticationResponse> GetAuthenticationAsync(CancellationToken cancellationToken)
    {
        if (IsCurrentAuthenticationValid())
        {
            return _currentAuthentication!;
        }

        await _loginLock.WaitAsync(cancellationToken);
        try
        {
            if (IsCurrentAuthenticationValid())
            {
                return _currentAuthentication!;
            }

            _logger.LogInformation("Logging in BitFinance MCP agent as {Email}.", _options.AgentEmail);

            var client = _httpClientFactory.CreateClient(BitFinanceApiClient.ClientName);
            var path = $"/api/v{_options.ApiVersion}/identity/login";
            using var response = await client.PostAsJsonAsync(
                path,
                new LoginRequest(_options.AgentEmail, _options.AgentPassword),
                BitFinanceJsonContext.Default.LoginRequest,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new BitFinanceApiException(response.StatusCode, HttpMethod.Post.Method, path, errorBody);
            }

            _currentAuthentication = await response.Content.ReadFromJsonAsync(
                BitFinanceJsonContext.Default.AuthenticationResponse,
                cancellationToken);

            if (_currentAuthentication is null || string.IsNullOrWhiteSpace(_currentAuthentication.AccessToken))
            {
                throw new InvalidOperationException("BitFinance API login did not return an access token.");
            }

            return _currentAuthentication;
        }
        finally
        {
            _loginLock.Release();
        }
    }

    private bool IsCurrentAuthenticationValid()
    {
        return _currentAuthentication is not null
            && !string.IsNullOrWhiteSpace(_currentAuthentication.AccessToken)
            && _currentAuthentication.AccessTokenExpiresAt > DateTimeOffset.UtcNow.Add(RefreshSkew);
    }
}
