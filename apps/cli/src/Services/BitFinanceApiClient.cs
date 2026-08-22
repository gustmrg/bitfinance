using BitFinance.Cli.Configuration;
using BitFinance.Cli.Models;
using System.Globalization;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;

namespace BitFinance.Cli.Services;

public sealed class BitFinanceApiClient : IBitFinanceApiClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private readonly HttpClient _httpClient;
    private readonly CliConfiguration _configuration;

    public BitFinanceApiClient(HttpClient httpClient, CliConfiguration configuration)
    {
        _httpClient = httpClient ?? throw new ArgumentNullException(nameof(httpClient));
        _configuration = configuration ?? throw new ArgumentNullException(nameof(configuration));
    }

    public Task<List<OrganizationSummaryResponse>> ListOrganizationsAsync(CancellationToken cancellationToken = default) =>
        SendAsync<List<OrganizationSummaryResponse>>(HttpMethod.Get, ApiPath("organizations"), cancellationToken);

    public Task<OrganizationDetailsResponse> GetOrganizationAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default) =>
        SendAsync<OrganizationDetailsResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}"),
            cancellationToken);

    public Task<UpcomingBillsResponse> GetUpcomingBillsAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default) =>
        SendAsync<UpcomingBillsResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}/dashboard/upcoming-bills"),
            cancellationToken);

    public Task<RecentExpensesResponse> GetRecentExpensesAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default) =>
        SendAsync<RecentExpensesResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}/dashboard/recent-expenses"),
            cancellationToken);

    public Task<PagedResponse<BillResponse>> ListBillsAsync(
        Guid organizationId,
        int page,
        int pageSize,
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? status,
        string? description,
        CancellationToken cancellationToken = default)
    {
        var path = WithQuery(
            ApiPath($"organizations/{organizationId}/bills"),
            ("page", page.ToString(CultureInfo.InvariantCulture)),
            ("pageSize", pageSize.ToString(CultureInfo.InvariantCulture)),
            ("from", FormatDate(from)),
            ("to", FormatDate(to)),
            ("status", status),
            ("description", description));

        return SendAsync<PagedResponse<BillResponse>>(HttpMethod.Get, path, cancellationToken);
    }

    public Task<BillResponse> GetBillAsync(
        Guid organizationId,
        Guid billId,
        CancellationToken cancellationToken = default) =>
        SendAsync<BillResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}/bills/{billId}"),
            cancellationToken);

    public Task<ExpensePageResponse> ListExpensesAsync(
        Guid organizationId,
        int page,
        int pageSize,
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? status,
        string? description,
        string? paymentMethod,
        CancellationToken cancellationToken = default)
    {
        var path = WithQuery(
            ApiPath($"organizations/{organizationId}/expenses"),
            ("page", page.ToString(CultureInfo.InvariantCulture)),
            ("pageSize", pageSize.ToString(CultureInfo.InvariantCulture)),
            ("from", FormatDate(from)),
            ("to", FormatDate(to)),
            ("status", status),
            ("description", description),
            ("paymentMethod", paymentMethod));

        return SendAsync<ExpensePageResponse>(HttpMethod.Get, path, cancellationToken);
    }

    public Task<ExpenseResponse> GetExpenseAsync(
        Guid organizationId,
        Guid expenseId,
        CancellationToken cancellationToken = default) =>
        SendAsync<ExpenseResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}/expenses/{expenseId}"),
            cancellationToken);

    private async Task<TResponse> SendAsync<TResponse>(
        HttpMethod method,
        string path,
        CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _configuration.AccessToken);

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new BitFinanceApiException((int)response.StatusCode, method.Method, path, responseBody);
        }

        var value = await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions, cancellationToken);
        return value ?? throw new InvalidOperationException(
            $"BitFinance API returned an empty response for {method.Method} {path}.");
    }

    private string ApiPath(string relativePath) =>
        $"/api/v{_configuration.ApiVersion}/{relativePath.TrimStart('/')}";

    private static string? FormatDate(DateTimeOffset? value) =>
        value?.UtcDateTime.ToString("O", CultureInfo.InvariantCulture);

    private static string WithQuery(string path, params (string Name, string? Value)[] parameters)
    {
        var query = parameters
            .Where(parameter => !string.IsNullOrWhiteSpace(parameter.Value))
            .Select(parameter =>
                $"{Uri.EscapeDataString(parameter.Name)}={Uri.EscapeDataString(parameter.Value!)}");

        var queryString = string.Join("&", query);
        return string.IsNullOrEmpty(queryString) ? path : $"{path}?{queryString}";
    }
}
