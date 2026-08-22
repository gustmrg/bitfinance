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

    public Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default) =>
        SendAsync<CurrentUserResponse>(HttpMethod.Get, ApiPath("identity/me"), cancellationToken);

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

    public Task<BillResponse> CreateBillAsync(
        Guid organizationId,
        CreateBillRequest request,
        CancellationToken cancellationToken = default) =>
        SendJsonAsync<BillResponse>(
            HttpMethod.Post,
            ApiPath($"organizations/{organizationId}/bills"),
            request,
            cancellationToken);

    public Task<UpdateBillResponse> UpdateBillAsync(
        Guid organizationId,
        Guid billId,
        UpdateBillRequest request,
        CancellationToken cancellationToken = default) =>
        SendJsonAsync<UpdateBillResponse>(
            HttpMethod.Patch,
            ApiPath($"organizations/{organizationId}/bills/{billId}"),
            request,
            cancellationToken);

    public Task DeleteBillAsync(
        Guid organizationId,
        Guid billId,
        CancellationToken cancellationToken = default) =>
        SendNoContentAsync(
            HttpMethod.Delete,
            ApiPath($"organizations/{organizationId}/bills/{billId}"),
            cancellationToken);

    public Task StopBillSeriesAsync(
        Guid organizationId,
        Guid seriesId,
        CancellationToken cancellationToken = default) =>
        SendNoContentAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{organizationId}/bills/series/{seriesId}/stop"),
            cancellationToken);

    public Task<UploadDocumentResponse> UploadBillDocumentAsync(
        Guid organizationId,
        Guid billId,
        Stream content,
        string fileName,
        string contentType,
        string fileCategory,
        CancellationToken cancellationToken = default) =>
        UploadDocumentAsync(
            ApiPath($"organizations/{organizationId}/bills/{billId}/documents"),
            content,
            fileName,
            contentType,
            fileCategory,
            cancellationToken);

    public Task<DocumentDownloadUrlResponse> GetBillDocumentDownloadUrlAsync(
        Guid organizationId,
        Guid billId,
        Guid documentId,
        CancellationToken cancellationToken = default) =>
        SendAsync<DocumentDownloadUrlResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}/bills/{billId}/documents/{documentId}/download-url"),
            cancellationToken);

    public Task DeleteBillDocumentAsync(
        Guid organizationId,
        Guid billId,
        Guid documentId,
        CancellationToken cancellationToken = default) =>
        SendNoContentAsync(
            HttpMethod.Delete,
            ApiPath($"organizations/{organizationId}/bills/{billId}/documents/{documentId}"),
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

    public Task<ExpenseResponse> CreateExpenseAsync(
        Guid organizationId,
        CreateExpenseRequest request,
        CancellationToken cancellationToken = default) =>
        SendJsonAsync<ExpenseResponse>(
            HttpMethod.Post,
            ApiPath($"organizations/{organizationId}/expenses"),
            request,
            cancellationToken);

    public Task<ExpenseResponse> UpdateExpenseAsync(
        Guid organizationId,
        Guid expenseId,
        UpdateExpenseRequest request,
        CancellationToken cancellationToken = default) =>
        SendJsonAsync<ExpenseResponse>(
            HttpMethod.Patch,
            ApiPath($"organizations/{organizationId}/expenses/{expenseId}"),
            request,
            cancellationToken);

    public Task<UploadDocumentResponse> UploadExpenseDocumentAsync(
        Guid organizationId,
        Guid expenseId,
        Stream content,
        string fileName,
        string contentType,
        string fileCategory,
        CancellationToken cancellationToken = default) =>
        UploadDocumentAsync(
            ApiPath($"organizations/{organizationId}/expenses/{expenseId}/documents"),
            content,
            fileName,
            contentType,
            fileCategory,
            cancellationToken);

    public Task<DocumentDownloadUrlResponse> GetExpenseDocumentDownloadUrlAsync(
        Guid organizationId,
        Guid expenseId,
        Guid documentId,
        CancellationToken cancellationToken = default) =>
        SendAsync<DocumentDownloadUrlResponse>(
            HttpMethod.Get,
            ApiPath($"organizations/{organizationId}/expenses/{expenseId}/documents/{documentId}/download-url"),
            cancellationToken);

    public Task DeleteExpenseDocumentAsync(
        Guid organizationId,
        Guid expenseId,
        Guid documentId,
        CancellationToken cancellationToken = default) =>
        SendNoContentAsync(
            HttpMethod.Delete,
            ApiPath($"organizations/{organizationId}/expenses/{expenseId}/documents/{documentId}"),
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

    private async Task<TResponse> SendJsonAsync<TResponse>(
        HttpMethod method,
        string path,
        object body,
        CancellationToken cancellationToken)
    {
        using var content = JsonContent.Create(body, options: JsonOptions);
        return await SendContentAsync<TResponse>(method, path, content, cancellationToken);
    }

    private async Task<UploadDocumentResponse> UploadDocumentAsync(
        string path,
        Stream content,
        string fileName,
        string contentType,
        string fileCategory,
        CancellationToken cancellationToken)
    {
        using var multipart = new MultipartFormDataContent();
        using var fileContent = new StreamContent(content);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        multipart.Add(fileContent, "File", fileName);
        multipart.Add(new StringContent(fileCategory), "FileCategory");

        return await SendContentAsync<UploadDocumentResponse>(
            HttpMethod.Post,
            path,
            multipart,
            cancellationToken);
    }

    private async Task<TResponse> SendContentAsync<TResponse>(
        HttpMethod method,
        string path,
        HttpContent content,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(method, path);
        request.Content = content;

        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, method, path, cancellationToken);
        var value = await response.Content.ReadFromJsonAsync<TResponse>(JsonOptions, cancellationToken);
        return value ?? throw new InvalidOperationException(
            $"BitFinance API returned an empty response for {method.Method} {path}.");
    }

    private async Task SendNoContentAsync(
        HttpMethod method,
        string path,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(method, path);
        using var response = await _httpClient.SendAsync(request, cancellationToken);
        await EnsureSuccessAsync(response, method, path, cancellationToken);
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string path)
    {
        var request = new HttpRequestMessage(method, path);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _configuration.AccessToken);
        return request;
    }

    private static async Task EnsureSuccessAsync(
        HttpResponseMessage response,
        HttpMethod method,
        string path,
        CancellationToken cancellationToken)
    {
        if (response.IsSuccessStatusCode)
        {
            return;
        }

        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        throw new BitFinanceApiException((int)response.StatusCode, method.Method, path, responseBody);
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
