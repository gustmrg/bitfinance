using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization.Metadata;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Models;
using ModelContextProtocol;

namespace BitFinance.MCP.Services;

public sealed class BitFinanceApiClient : IBitFinanceApiClient
{
    public const string ClientName = "BitFinanceBackend";
    private const long MaxDocumentFileSizeBytes = 10 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> DocumentContentTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".doc"] = "application/msword",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly BitFinanceOptions _options;

    public BitFinanceApiClient(
        IHttpClientFactory httpClientFactory,
        BitFinanceOptions options)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
    }

    public async Task<List<ApiKeyOrganizationResponse>> ListOrganizationsAsync(CancellationToken cancellationToken = default)
    {
        var apiKey = await SendAsync(
            HttpMethod.Get,
            ApiPath("api-keys/current"),
            BitFinanceJsonContext.Default.CurrentApiKeyResponse,
            cancellationToken);
        return apiKey.Organizations;
    }

    public async Task<OrganizationDetailsResponse> GetOrganizationAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}"),
            BitFinanceJsonContext.Default.OrganizationDetailsResponse,
            cancellationToken);
    }

    public async Task<UpcomingBillsResponse> GetUpcomingBillsAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/dashboard/upcoming-bills"),
            BitFinanceJsonContext.Default.UpcomingBillsResponse,
            cancellationToken);
    }

    public async Task<RecentExpensesResponse> GetRecentExpensesAsync(Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/dashboard/recent-expenses"),
            BitFinanceJsonContext.Default.RecentExpensesResponse,
            cancellationToken);
    }

    public async Task<PagedResponse<BillResponse>> ListBillsAsync(
        Guid? organizationId = null,
        int page = 1,
        int pageSize = 100,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        string? status = null,
        string? description = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        var path = WithQuery(
            ApiPath($"organizations/{resolvedOrganizationId}/bills"),
            ("page", page.ToString()),
            ("pageSize", pageSize.ToString()),
            ("from", from?.UtcDateTime.ToString("O")),
            ("to", to?.UtcDateTime.ToString("O")),
            ("status", status),
            ("description", description));

        return await SendAsync(HttpMethod.Get, path, BitFinanceJsonContext.Default.PagedResponseBillResponse, cancellationToken);
    }

    public async Task<BillResponse> GetBillAsync(Guid billId, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}"),
            BitFinanceJsonContext.Default.BillResponse,
            cancellationToken);
    }

    public async Task<BillResponse> CreateBillAsync(CreateBillRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{resolvedOrganizationId}/bills"),
            BitFinanceJsonContext.Default.BillResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.CreateBillRequest);
    }

    public async Task<UpdateBillResponse> UpdateBillAsync(
        Guid billId,
        UpdateBillRequest request,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Patch,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}"),
            BitFinanceJsonContext.Default.UpdateBillResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.UpdateBillRequest);
    }

    public async Task DeleteBillAsync(Guid billId, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        await SendNoContentAsync(
            HttpMethod.Delete,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}"),
            cancellationToken);
    }

    public async Task StopBillSeriesAsync(
        Guid seriesId,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        await SendNoContentAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/series/{seriesId}/stop"),
            cancellationToken);
    }

    public async Task<UploadDocumentResponse> UploadBillDocumentAsync(
        Guid billId,
        string fileName,
        string base64Content,
        string fileCategory,
        Guid? organizationId = null,
        string? contentType = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await UploadDocumentAsync(
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}/documents"),
            fileName,
            base64Content,
            fileCategory,
            contentType,
            cancellationToken);
    }

    public async Task<DocumentDownloadUrlResponse> GetBillDocumentDownloadUrlAsync(
        Guid billId,
        Guid documentId,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}/documents/{documentId}/download-url"),
            BitFinanceJsonContext.Default.DocumentDownloadUrlResponse,
            cancellationToken);
    }

    public async Task DeleteBillDocumentAsync(
        Guid billId,
        Guid documentId,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        await SendNoContentAsync(
            HttpMethod.Delete,
            ApiPath($"organizations/{resolvedOrganizationId}/bills/{billId}/documents/{documentId}"),
            cancellationToken);
    }

    public async Task<ExpensePageResponse> ListExpensesAsync(
        Guid? organizationId = null,
        int page = 1,
        int pageSize = 20,
        DateTimeOffset? from = null,
        DateTimeOffset? to = null,
        string? status = null,
        string? description = null,
        string? paymentMethod = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        var path = WithQuery(
            ApiPath($"organizations/{resolvedOrganizationId}/expenses"),
            ("page", page.ToString()),
            ("pageSize", pageSize.ToString()),
            ("from", from?.UtcDateTime.ToString("O")),
            ("to", to?.UtcDateTime.ToString("O")),
            ("status", status),
            ("description", description),
            ("paymentMethod", paymentMethod));

        return await SendAsync(HttpMethod.Get, path, BitFinanceJsonContext.Default.ExpensePageResponse, cancellationToken);
    }

    public async Task<ExpenseResponse> GetExpenseAsync(Guid expenseId, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/{expenseId}"),
            BitFinanceJsonContext.Default.ExpenseResponse,
            cancellationToken);
    }

    public async Task<ExpenseResponse> CreateExpenseAsync(CreateExpenseRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses"),
            BitFinanceJsonContext.Default.ExpenseResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.CreateExpenseRequest);
    }

    public async Task<CreateExpensesBatchResponse> CreateExpensesBatchAsync(CreateExpensesBatchRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Post,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/batch"),
            BitFinanceJsonContext.Default.CreateExpensesBatchResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.CreateExpensesBatchRequest);
    }

    public async Task<ExpenseResponse> UpdateExpenseAsync(
        Guid expenseId,
        UpdateExpenseRequest request,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Patch,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/{expenseId}"),
            BitFinanceJsonContext.Default.ExpenseResponse,
            cancellationToken,
            request,
            BitFinanceJsonContext.Default.UpdateExpenseRequest);
    }

    public async Task<UploadDocumentResponse> UploadExpenseDocumentAsync(
        Guid expenseId,
        string fileName,
        string base64Content,
        string fileCategory,
        Guid? organizationId = null,
        string? contentType = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await UploadDocumentAsync(
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/{expenseId}/documents"),
            fileName,
            base64Content,
            fileCategory,
            contentType,
            cancellationToken);
    }

    public async Task<DocumentDownloadUrlResponse> GetExpenseDocumentDownloadUrlAsync(
        Guid expenseId,
        Guid documentId,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        return await SendAsync(
            HttpMethod.Get,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/{expenseId}/documents/{documentId}/download-url"),
            BitFinanceJsonContext.Default.DocumentDownloadUrlResponse,
            cancellationToken);
    }

    public async Task DeleteExpenseDocumentAsync(
        Guid expenseId,
        Guid documentId,
        Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedOrganizationId = await ResolveOrganizationIdAsync(organizationId, cancellationToken);
        await SendNoContentAsync(
            HttpMethod.Delete,
            ApiPath($"organizations/{resolvedOrganizationId}/expenses/{expenseId}/documents/{documentId}"),
            cancellationToken);
    }

    private async Task<UploadDocumentResponse> UploadDocumentAsync(
        string path,
        string fileName,
        string base64Content,
        string fileCategory,
        string? contentType,
        CancellationToken cancellationToken)
    {
        var upload = ValidateUploadContent(fileName);
        var base64Upload = ParseBase64Upload(base64Content, contentType, upload.InferredContentType);

        if (base64Upload.Content.Length > MaxDocumentFileSizeBytes)
        {
            throw new InvalidOperationException("Document file must be 10 MB or smaller.");
        }

        await using var fileStream = new MemoryStream(base64Upload.Content, writable: false);
        using var multipart = new MultipartFormDataContent();
        using var fileContent = new StreamContent(fileStream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue(base64Upload.ContentType);

        multipart.Add(fileContent, "File", upload.FileName);
        multipart.Add(new StringContent(fileCategory), "FileCategory");

        return await SendContentAsync(
            HttpMethod.Post,
            path,
            multipart,
            BitFinanceJsonContext.Default.UploadDocumentResponse,
            cancellationToken);
    }

    // Without an explicit organizationId, use the key's organization when it has exactly one.
    private async Task<Guid> ResolveOrganizationIdAsync(Guid? organizationId, CancellationToken cancellationToken)
    {
        if (organizationId.HasValue)
        {
            return organizationId.Value;
        }

        var organizations = await ListOrganizationsAsync(cancellationToken);
        if (organizations.Count == 1)
        {
            return organizations[0].OrganizationId;
        }

        throw new McpException(
            $"This API key can access {organizations.Count} organizations, so organizationId is required. Call bitfinance_list_organizations to see them.");
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
            throw new BitFinanceApiException(response.StatusCode, method.Method, path);
        }

        var value = await response.Content.ReadFromJsonAsync(responseJsonTypeInfo, cancellationToken);
        if (value is null)
        {
            throw new InvalidOperationException($"BitFinance API returned an empty response for {method.Method} {path}.");
        }

        return value;
    }

    private async Task<TResponse> SendContentAsync<TResponse>(
        HttpMethod method,
        string path,
        HttpContent content,
        JsonTypeInfo<TResponse> responseJsonTypeInfo,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(ClientName);
        using var httpRequest = new HttpRequestMessage(method, path);
        httpRequest.Content = content;

        using var response = await client.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new BitFinanceApiException(response.StatusCode, method.Method, path);
        }

        var value = await response.Content.ReadFromJsonAsync(responseJsonTypeInfo, cancellationToken);
        if (value is null)
        {
            throw new InvalidOperationException($"BitFinance API returned an empty response for {method.Method} {path}.");
        }

        return value;
    }

    private async Task SendNoContentAsync(
        HttpMethod method,
        string path,
        CancellationToken cancellationToken)
    {
        var client = _httpClientFactory.CreateClient(ClientName);
        using var httpRequest = new HttpRequestMessage(method, path);

        using var response = await client.SendAsync(httpRequest, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new BitFinanceApiException(response.StatusCode, method.Method, path);
        }
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

    private static UploadContent ValidateUploadContent(string fileName)
    {
        if (string.IsNullOrWhiteSpace(fileName))
        {
            throw new ArgumentException("fileName is required.", nameof(fileName));
        }

        if (fileName.IndexOfAny(['/', '\\']) >= 0 ||
            fileName.Contains("..", StringComparison.Ordinal) ||
            fileName.Contains('~') ||
            fileName.Contains('`'))
        {
            throw new ArgumentException("fileName must be a simple file name without path segments or unsafe characters.", nameof(fileName));
        }

        var extension = Path.GetExtension(fileName);
        if (!DocumentContentTypes.TryGetValue(extension, out var inferredContentType))
        {
            throw new InvalidOperationException("Document file extension must be one of: .pdf, .jpg, .jpeg, .png, .doc, .docx.");
        }

        return new UploadContent(
            fileName,
            inferredContentType);
    }

    private static Base64Upload ParseBase64Upload(string base64Content, string? contentType, string inferredContentType)
    {
        if (string.IsNullOrWhiteSpace(base64Content))
        {
            throw new ArgumentException("base64Content is required.", nameof(base64Content));
        }

        var payload = base64Content.Trim();
        var resolvedContentType = string.IsNullOrWhiteSpace(contentType) ? null : contentType;

        if (payload.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            var commaIndex = payload.IndexOf(',');
            if (commaIndex < 0)
            {
                throw new FormatException("Data URL content must include a comma before the base64 payload.");
            }

            var metadata = payload[5..commaIndex];
            if (!metadata.Contains(";base64", StringComparison.OrdinalIgnoreCase))
            {
                throw new FormatException("Data URL content must be base64 encoded.");
            }

            var mediaType = metadata.Split(';', 2)[0];
            if (string.IsNullOrWhiteSpace(contentType) && !string.IsNullOrWhiteSpace(mediaType))
            {
                resolvedContentType = mediaType;
            }

            payload = payload[(commaIndex + 1)..];
        }

        resolvedContentType ??= inferredContentType;

        try
        {
            return new Base64Upload(Convert.FromBase64String(payload), resolvedContentType);
        }
        catch (FormatException ex)
        {
            throw new FormatException("base64Content must be valid base64 file content.", ex);
        }
    }

    private sealed record UploadContent(string FileName, string InferredContentType);

    private sealed record Base64Upload(byte[] Content, string ContentType);
}
