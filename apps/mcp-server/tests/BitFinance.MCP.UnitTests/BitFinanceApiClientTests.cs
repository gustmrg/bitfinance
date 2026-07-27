using System.Net;
using System.Net.Http.Headers;
using System.Text;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Services;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public class BitFinanceApiClientTests
{
    [Fact]
    public async Task UploadExpenseDocument_DataUrl_SendsExpectedMultipartRequest()
    {
        var organizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var handler = new RecordingHandler(_ => JsonResponse(
            HttpStatusCode.OK,
            $$"""
            {
              "id": "{{Guid.NewGuid()}}",
              "fileName": "receipt.png",
              "contentType": "image/png",
              "fileCategory": "Receipt",
              "attachmentType": "ExpenseDocument"
            }
            """));
        var client = CreateClient(handler, organizationId);
        var bytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };

        var result = await client.UploadExpenseDocumentAsync(
            expenseId,
            "receipt.png",
            $"data:image/png;base64,{Convert.ToBase64String(bytes)}",
            "Receipt");

        Assert.Equal("receipt.png", result.FileName);
        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/expenses/{expenseId}/documents",
            handler.RequestUri?.AbsolutePath);
        Assert.Equal("Bearer", handler.Authorization?.Scheme);
        Assert.Equal("test-token", handler.Authorization?.Parameter);
        Assert.Contains("name=File", handler.RequestBody);
        Assert.Contains("filename=receipt.png", handler.RequestBody);
        Assert.Contains("name=FileCategory", handler.RequestBody);
        Assert.Contains("Receipt", handler.RequestBody);
    }

    [Fact]
    public async Task UploadExpenseDocument_OversizedPayload_DoesNotSendRequest()
    {
        var handler = new RecordingHandler(_ => throw new InvalidOperationException("HTTP should not run."));
        var client = CreateClient(handler, Guid.NewGuid());
        var payload = Convert.ToBase64String(new byte[10 * 1024 * 1024 + 1]);

        var exception = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            client.UploadExpenseDocumentAsync(
                Guid.NewGuid(),
                "receipt.png",
                payload,
                "Receipt"));

        Assert.Contains("10 MB or smaller", exception.Message);
        Assert.Null(handler.Method);
    }

    [Theory]
    [InlineData("receipt.webp", "AAAA", "extension must be one of")]
    [InlineData("receipt.png", "not-base64", "valid base64")]
    public async Task UploadExpenseDocument_InvalidInput_DoesNotSendRequest(
        string fileName,
        string base64Content,
        string expectedMessage)
    {
        var handler = new RecordingHandler(_ => throw new InvalidOperationException("HTTP should not run."));
        var client = CreateClient(handler, Guid.NewGuid());

        var exception = await Assert.ThrowsAnyAsync<Exception>(() =>
            client.UploadExpenseDocumentAsync(
                Guid.NewGuid(),
                fileName,
                base64Content,
                "Receipt"));

        Assert.Contains(expectedMessage, exception.Message);
        Assert.Null(handler.Method);
    }

    [Fact]
    public async Task ExpenseDocumentLifecycle_UsesExpectedRoutes()
    {
        var organizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var documentId = Guid.NewGuid();
        var handler = new RecordingHandler(request =>
            request.Method == HttpMethod.Get
                ? JsonResponse(
                    HttpStatusCode.OK,
                    $$"""
                    {
                      "url": "https://storage.example/document",
                      "fileName": "receipt.png",
                      "contentType": "image/png",
                      "expiresAt": "2026-07-26T12:00:00Z"
                    }
                    """)
                : new HttpResponseMessage(HttpStatusCode.NoContent));
        var client = CreateClient(handler, organizationId);

        var download = await client.GetExpenseDocumentDownloadUrlAsync(expenseId, documentId);

        Assert.Equal("receipt.png", download.FileName);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/expenses/{expenseId}/documents/{documentId}/download-url",
            handler.RequestUri?.AbsolutePath);

        await client.DeleteExpenseDocumentAsync(expenseId, documentId);

        Assert.Equal(HttpMethod.Delete, handler.Method);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/expenses/{expenseId}/documents/{documentId}",
            handler.RequestUri?.AbsolutePath);
    }

    [Fact]
    public async Task UploadExpenseDocument_FreePlanResponse_RemainsForbiddenToolError()
    {
        var handler = new RecordingHandler(_ =>
            JsonResponse(
                HttpStatusCode.Forbidden,
                """{"error":"File attachments are not available on your current plan."}"""));
        var client = CreateClient(handler, Guid.NewGuid());

        var exception = await Assert.ThrowsAsync<BitFinanceApiException>(() =>
            client.UploadExpenseDocumentAsync(
                Guid.NewGuid(),
                "receipt.png",
                Convert.ToBase64String(new byte[] { 0x89, 0x50, 0x4E, 0x47 }),
                "Receipt"));

        Assert.Equal(HttpStatusCode.Forbidden, exception.StatusCode);
        Assert.Contains("not available on your current plan", exception.Message);
    }

    private static BitFinanceApiClient CreateClient(RecordingHandler handler, Guid organizationId)
    {
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.example")
        };
        return new BitFinanceApiClient(
            new StaticHttpClientFactory(httpClient),
            new StaticTokenProvider(),
            new BitFinanceOptions
            {
                ApiBaseUrl = httpClient.BaseAddress,
                DefaultOrganizationId = organizationId
            });
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode statusCode, string json) =>
        new(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

    private sealed class StaticHttpClientFactory(HttpClient client) : IHttpClientFactory
    {
        public HttpClient CreateClient(string name) => client;
    }

    private sealed class StaticTokenProvider : IBitFinanceTokenProvider
    {
        public Task<string> GetAccessTokenAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult("test-token");

        public Task<string> GetAgentUserIdAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult("agent-user");
    }

    private sealed class RecordingHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public HttpMethod? Method { get; private set; }
        public Uri? RequestUri { get; private set; }
        public AuthenticationHeaderValue? Authorization { get; private set; }
        public string RequestBody { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Method = request.Method;
            RequestUri = request.RequestUri;
            Authorization = request.Headers.Authorization;
            RequestBody = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return responseFactory(request);
        }
    }
}
