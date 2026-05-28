using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Models;

namespace BitFinance.MCP.Services;

public sealed class BitFinanceApiClient : IBitFinanceApiClient
{
    public const string ClientName = "BitFinanceBackend";

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IBitFinanceTokenProvider _tokenProvider;
    private readonly BitFinanceOptions _options;

    public BitFinanceApiClient(
        IHttpClientFactory httpClientFactory,
        IBitFinanceTokenProvider tokenProvider,
        BitFinanceOptions options)
    {
        _httpClientFactory = httpClientFactory;
        _tokenProvider = tokenProvider;
        _options = options;
    }

    public Guid GetOrganizationIdOrDefault(Guid? organizationId)
    {
        if (organizationId.HasValue)
        {
            return organizationId.Value;
        }

        if (_options.DefaultOrganizationId.HasValue)
        {
            return _options.DefaultOrganizationId.Value;
        }

        throw new InvalidOperationException("No organizationId was provided and BITFINANCE_DEFAULT_ORGANIZATION_ID is not configured.");
    }

    public Task<List<OrganizationSummaryResponse>> ListOrganizationsAsync(CancellationToken cancellationToken = default)
    {
        return SendAsync(
            HttpMethod.Get,
            ApiPath("organizations"),
            BitFinanceJsonContext.Default.ListOrganizationSummaryResponse,
            cancellationToken);
    }

    public Task<OrganizationDetailsResponse> GetOrganizationAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}"),
            BitFinanceJsonContext.Default.OrganizationDetailsResponse,
            cancellationToken);
    }

    public Task<UpcomingBillsResponse> GetUpcomingBillsAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/dashboard/upcoming-bills"),
            BitFinanceJsonContext.Default.UpcomingBillsResponse,
            cancellationToken);
    }

    public Task<RecentExpensesResponse> GetRecentExpensesAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/dashboard/recent-expenses"),
            BitFinanceJsonContext.Default.RecentExpensesResponse,
            cancellationToken);
    }

    public Task<PagedResponse<BillResponse>> ListBillsAsync(
        Guid? organizationId = null,
        int page = 1,
        int pageSize = 20,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        string? status = null,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        var path = WithQuery(
            ApiPath($"organizations/{resolvedOrganizationId}/bills"),
            ("page", page.ToString()),
            ("pageSize", pageSize.ToString()),
            ("from", from?.UtcDateTime.ToString("O")),
            ("to", to?.UtcDateTime.ToString("O")),
            ("status", status),
            ("description", description));

        return SendAsync(HttpMethod.Get, path, BitFinanceJsonContext.Default.PagedResponseBillResponse, cancellationToken);
    }

    public Task<BillResponse> GetBillAsync(Guid billId, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}"),
            BitFinanceJsonContext.Default.BillResponse,
            cancellationToken);
    }

    public Task<BillResponse> CreateBillAsync(CreateBillRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{resolvedOrganizationId}/bills"),
            BitFinanceJsonContext.Default.BillResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.CreateBillRequest);
    }

    public Task<PagedResponse<ExpenseResponse>> ListExpensesAsync(
        Guid? organizationId = null,
        int page = 1,
        int pageSize = 20,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        var path = WithQuery(
            ApiPath($"organizations/{resolvedOrganizationId}/expenses"),
            ("page", page.ToString()),
            ("pageSize", pageSize.ToString()),
            ("from", from?.UtcDateTime.ToString("O")),
            ("to", to?.UtcDateTime.ToString("O")));

        return SendAsync(HttpMethod.Get, path, BitFinanceJsonContext.Default.PagedResponseExpenseResponse, cancellationToken);
    }

    public Task<ExpenseResponse> GetExpenseAsync(Guid expenseId, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/{expenseId}"),
            BitFinanceJsonContext.Default.ExpenseResponse,
            cancellationToken);
    }

    public Task<ExpenseResponse> CreateExpenseAsync(CreateExpenseRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = GetOrganizationIdOrDefault(organizationId);
        return SendAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses"),
            BitFinanceJsonContext.Default.ExpenseResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.CreateExpenseRequest);
    }

    private async Task<TResponse> SendAsync<TResponse>(
        HttpMethod method,
        string path,
        JsonTypeInfo<TResponse> responseJsonTypeInfo,
        CancellationToken cancellationToken,
        object? request = null,
        JsonTypeInfo? requestJsonTypeInfo = null)
    {
        var client = _httpClientFactory.CreateClient(ClientName);
        using var httpRequest = new HttpRequestMessage(method, path);
        httpRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", await _tokenProvider.GetAccessTokenAsync(cancellationToken));

        if (request is not null)
        {
            if (requestJsonTypeInfo is null)
            {
                throw new InvalidOperationException("Request JSON type metadata is required when a request body is provided.");
            }

            httpRequest.Content = JsonContent.Create(request, requestJsonTypeInfo);
        }

        using var response = await client.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new BitFinanceApiException(response.StatusCode, method.Method, path, errorBody);
        }

        var value = await response.Content.ReadFromJsonAsync(responseJsonTypeInfo, cancellationToken);
        if (value is null)
        {
            throw new InvalidOperationException($"BitFinance API returned an empty response for {method.Method} {path}.");
        }

        return value;
    }

    private string ApiPath(string relativePath)
    {
        return $"/api/v{_options.ApiVersion}/{relativePath.TrimStart('/')}";
    }

    private static string WithQuery(string path, params (string Name, string? Value)[] parameters)
    {
        var query = parameters
            .Where(parameter => !string.IsNullOrWhiteSpace(parameter.Value))
            .Select(parameter => $"{Uri.EscapeDataString(parameter.Name)}={Uri.EscapeDataString(parameter.Value!)}");

        var queryString = string.Join("&", query);
        return string.IsNullOrWhiteSpace(queryString) ? path : $"{path}?{queryString}";
    }
}
