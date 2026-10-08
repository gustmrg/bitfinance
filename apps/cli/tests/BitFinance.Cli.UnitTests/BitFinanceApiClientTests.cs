using BitFinance.Cli.Configuration;
using BitFinance.Cli.Models;
using BitFinance.Cli.Services;
using System.Net;
using System.Net.Http.Headers;
using System.Text;

namespace BitFinance.Cli.UnitTests;

public sealed class BitFinanceApiClientTests
{
    [Fact]
    public async Task OrganizationRequests_UseExpectedRoutesAndBearerToken()
    {
        var organizationId = Guid.NewGuid();
        var handler = new RecordingHandler(request => request.RequestUri!.AbsolutePath.EndsWith("organizations")
            ? JsonResponse(HttpStatusCode.OK, "[]")
            : JsonResponse(
                HttpStatusCode.OK,
                $$"""
                {
                  "id": "{{organizationId}}",
                  "name": "Household",
                  "planTier": "Basic",
                  "planExpiresAt": "2027-01-01T00:00:00Z",
                  "members": []
                }
                """));
        var client = CreateClient(handler);

        await client.ListOrganizationsAsync();
        await client.GetOrganizationAsync(organizationId);

        Assert.Equal(2, handler.Requests.Count);
        Assert.Equal("/api/v1/organizations", handler.Requests[0].Uri.AbsolutePath);
        Assert.Equal($"/api/v1/organizations/{organizationId}", handler.Requests[1].Uri.AbsolutePath);
        Assert.All(handler.Requests, request =>
        {
            Assert.Equal("Bearer", request.Authorization?.Scheme);
            Assert.Equal("test-token", request.Authorization?.Parameter);
        });
    }

    [Fact]
    public async Task DashboardRequests_UseExpectedRoutes()
    {
        var organizationId = Guid.NewGuid();
        var handler = new RecordingHandler(request =>
            request.RequestUri!.AbsolutePath.EndsWith("upcoming-bills")
                ? JsonResponse(HttpStatusCode.OK, """{"data":[]}""")
                : JsonResponse(HttpStatusCode.OK, """{"data":[]}"""));
        var client = CreateClient(handler);

        await client.GetUpcomingBillsAsync(organizationId);
        await client.GetRecentExpensesAsync(organizationId);

        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/dashboard/upcoming-bills",
            handler.Requests[0].Uri.AbsolutePath);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/dashboard/recent-expenses",
            handler.Requests[1].Uri.AbsolutePath);
    }

    [Fact]
    public async Task ListBills_SendsPagingAndEncodedFilters()
    {
        var organizationId = Guid.NewGuid();
        var handler = new RecordingHandler(_ => JsonResponse(
            HttpStatusCode.OK,
            """{"data":[],"page":2,"pageSize":50,"totalRecords":0,"totalPages":0}"""));
        var client = CreateClient(handler);

        await client.ListBillsAsync(
            organizationId,
            2,
            50,
            DateTimeOffset.Parse("2026-05-01T00:00:00-03:00"),
            DateTimeOffset.Parse("2026-05-31T23:59:59-03:00"),
            "Due,Overdue",
            "rent & utilities");

        var request = Assert.Single(handler.Requests);
        Assert.Equal($"/api/v1/organizations/{organizationId}/bills", request.Uri.AbsolutePath);
        var query = Uri.UnescapeDataString(request.Uri.Query);
        Assert.Contains("page=2", query);
        Assert.Contains("pageSize=50", query);
        Assert.Contains("from=2026-05-01T03:00:00.0000000Z", query);
        Assert.Contains("to=2026-06-01T02:59:59.0000000Z", query);
        Assert.Contains("status=Due,Overdue", query);
        Assert.Contains("description=rent & utilities", query);
    }

    [Fact]
    public async Task BillAndExpenseGetRequests_UseExplicitOrganizationId()
    {
        var organizationId = Guid.NewGuid();
        var billId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var handler = new RecordingHandler(request => request.RequestUri!.AbsolutePath.Contains("/bills/")
            ? JsonResponse(HttpStatusCode.OK, $$"""{"id":"{{billId}}"}""")
            : JsonResponse(
                HttpStatusCode.OK,
                $$"""{"id":"{{expenseId}}","occurredAt":"2026-01-01T00:00:00Z"}"""));
        var client = CreateClient(handler);

        await client.GetBillAsync(organizationId, billId);
        await client.GetExpenseAsync(organizationId, expenseId);

        Assert.Equal($"/api/v1/organizations/{organizationId}/bills/{billId}", handler.Requests[0].Uri.AbsolutePath);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/expenses/{expenseId}",
            handler.Requests[1].Uri.AbsolutePath);
    }

    [Fact]
    public async Task ListExpenses_SendsPagingAndAllFilters()
    {
        var organizationId = Guid.NewGuid();
        var handler = new RecordingHandler(_ => JsonResponse(
            HttpStatusCode.OK,
            """{"data":[],"summary":{"totalAmount":0,"averageAmount":0}}"""));
        var client = CreateClient(handler, apiVersion: "2");

        await client.ListExpensesAsync(
            organizationId,
            3,
            25,
            null,
            null,
            "Paid",
            "coffee shop",
            "CreditCard");

        var request = Assert.Single(handler.Requests);
        Assert.Equal($"/api/v2/organizations/{organizationId}/expenses", request.Uri.AbsolutePath);
        var query = Uri.UnescapeDataString(request.Uri.Query);
        Assert.Contains("page=3", query);
        Assert.Contains("pageSize=25", query);
        Assert.Contains("status=Paid", query);
        Assert.Contains("description=coffee shop", query);
        Assert.Contains("paymentMethod=CreditCard", query);
        Assert.DoesNotContain("from=", query);
        Assert.DoesNotContain("to=", query);
    }

    [Fact]
    public async Task FailedRequest_ThrowsApiExceptionWithParsedDetails()
    {
        var handler = new RecordingHandler(_ => JsonResponse(
            HttpStatusCode.Unauthorized,
            """{"message":"Token expired"}"""));
        var client = CreateClient(handler);

        var exception = await Assert.ThrowsAsync<BitFinanceApiException>(() =>
            client.ListOrganizationsAsync());

        Assert.Equal(401, exception.StatusCode);
        Assert.NotNull(exception.Details);
        Assert.DoesNotContain("test-token", exception.ToString());
    }

    [Fact]
    public async Task BillMutations_UseExpectedMethodsRoutesAndJsonBodies()
    {
        var organizationId = Guid.NewGuid();
        var billId = Guid.NewGuid();
        var seriesId = Guid.NewGuid();
        var handler = new RecordingHandler(request => request.Method == HttpMethod.Delete
            || request.RequestUri!.AbsolutePath.EndsWith("/stop")
                ? new HttpResponseMessage(HttpStatusCode.NoContent)
                : request.Method == HttpMethod.Post
                    ? JsonResponse(HttpStatusCode.Created, $$"""{"id":"{{billId}}"}""")
                    : JsonResponse(
                        HttpStatusCode.OK,
                        $$"""{"id":"{{billId}}","dueDate":"2026-09-10T00:00:00Z"}"""));
        var client = CreateClient(handler);

        await client.CreateBillAsync(
            organizationId,
            new CreateBillRequest(
                "Rent", "Housing", "Upcoming", DateTimeOffset.Parse("2026-09-10T00:00:00Z"),
                null, 1500m, null, BillFrequency.Monthly, null, "Monthly rent"));
        await client.UpdateBillAsync(
            organizationId,
            billId,
            new UpdateBillRequest(
                "Rent", "Housing", "Paid", DateTimeOffset.Parse("2026-09-10T00:00:00Z"),
                DateTimeOffset.Parse("2026-09-08T00:00:00Z"), 1500m, 1500m, string.Empty));
        await client.DeleteBillAsync(organizationId, billId);
        await client.StopBillSeriesAsync(organizationId, seriesId);

        Assert.Equal(HttpMethod.Post, handler.Requests[0].Method);
        Assert.Equal($"/api/v1/organizations/{organizationId}/bills", handler.Requests[0].Uri.AbsolutePath);
        Assert.Contains("\"frequency\":\"Monthly\"", handler.Requests[0].Body);
        Assert.Contains("\"notes\":\"Monthly rent\"", handler.Requests[0].Body);
        Assert.Equal(HttpMethod.Patch, handler.Requests[1].Method);
        Assert.Contains("\"notes\":\"\"", handler.Requests[1].Body);
        Assert.Equal(HttpMethod.Delete, handler.Requests[2].Method);
        Assert.Equal($"/api/v1/organizations/{organizationId}/bills/{billId}", handler.Requests[2].Uri.AbsolutePath);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/bills/series/{seriesId}/stop",
            handler.Requests[3].Uri.AbsolutePath);
    }

    [Fact]
    public async Task ExpenseMutationsAndCurrentUser_UseExpectedRoutesAndBodies()
    {
        var organizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var handler = new RecordingHandler(request => request.RequestUri!.AbsolutePath.EndsWith("identity/me")
            ? JsonResponse(HttpStatusCode.OK, """{"id":"user-123"}""")
            : JsonResponse(
                request.Method == HttpMethod.Post ? HttpStatusCode.Created : HttpStatusCode.OK,
                $$"""{"id":"{{expenseId}}","occurredAt":"2026-08-20T12:00:00Z"}"""));
        var client = CreateClient(handler);

        var currentUser = await client.GetCurrentUserAsync();
        await client.CreateExpenseAsync(
            organizationId,
            new CreateExpenseRequest(
                "Lunch", "Food", 42.5m, "Paid", null, currentUser.Id, null, "Pix"));
        await client.UpdateExpenseAsync(
            organizationId,
            expenseId,
            new UpdateExpenseRequest(
                "Lunch", "Food", 45m, "Paid", DateTimeOffset.Parse("2026-08-20T12:00:00Z"),
                string.Empty, string.Empty));

        Assert.Equal("/api/v1/identity/me", handler.Requests[0].Uri.AbsolutePath);
        Assert.Equal(HttpMethod.Post, handler.Requests[1].Method);
        Assert.Contains("\"createdBy\":\"user-123\"", handler.Requests[1].Body);
        Assert.Contains("\"paymentMethod\":\"Pix\"", handler.Requests[1].Body);
        Assert.Equal(HttpMethod.Patch, handler.Requests[2].Method);
        Assert.Contains("\"paymentMethod\":\"\"", handler.Requests[2].Body);
    }

    [Fact]
    public async Task DocumentOperations_SendMultipartAndExpectedRoutes()
    {
        var organizationId = Guid.NewGuid();
        var billId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        var documentId = Guid.NewGuid();
        var handler = new RecordingHandler(request => request.Method == HttpMethod.Delete
            ? new HttpResponseMessage(HttpStatusCode.NoContent)
            : request.Method == HttpMethod.Post
                ? JsonResponse(
                    HttpStatusCode.OK,
                    $$"""{"id":"{{documentId}}","fileName":"receipt.pdf"}""")
                : JsonResponse(
                    HttpStatusCode.OK,
                    """{"url":"https://files.example/receipt","fileName":"receipt.pdf","contentType":"application/pdf","expiresAt":"2026-08-22T12:00:00Z"}"""));
        var client = CreateClient(handler);

        await client.UploadBillDocumentAsync(
            organizationId,
            billId,
            new MemoryStream([1, 2, 3]),
            "receipt.pdf",
            "application/pdf",
            "Receipt");
        await client.GetBillDocumentDownloadUrlAsync(organizationId, billId, documentId);
        await client.DeleteBillDocumentAsync(organizationId, billId, documentId);
        await client.UploadExpenseDocumentAsync(
            organizationId,
            expenseId,
            new MemoryStream([4, 5, 6]),
            "receipt.pdf",
            "application/pdf",
            "Receipt");
        await client.GetExpenseDocumentDownloadUrlAsync(organizationId, expenseId, documentId);
        await client.DeleteExpenseDocumentAsync(organizationId, expenseId, documentId);

        Assert.Contains("name=File", handler.Requests[0].Body);
        Assert.Contains("filename=receipt.pdf", handler.Requests[0].Body);
        Assert.Contains("name=FileCategory", handler.Requests[0].Body);
        Assert.Equal(
            $"/api/v1/organizations/{organizationId}/bills/{billId}/documents/{documentId}/download-url",
            handler.Requests[1].Uri.AbsolutePath);
        Assert.Equal(HttpMethod.Delete, handler.Requests[2].Method);
        Assert.Contains($"/expenses/{expenseId}/documents", handler.Requests[3].Uri.AbsolutePath);
        Assert.EndsWith($"/{documentId}/download-url", handler.Requests[4].Uri.AbsolutePath);
        Assert.Equal(HttpMethod.Delete, handler.Requests[5].Method);
    }

    private static BitFinanceApiClient CreateClient(RecordingHandler handler, string apiVersion = "1")
    {
        var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://api.example.com"),
            Timeout = TimeSpan.FromSeconds(30)
        };
        return new BitFinanceApiClient(
            httpClient,
            new CliConfiguration(httpClient.BaseAddress, "test-token", apiVersion));
    }

    private static HttpResponseMessage JsonResponse(HttpStatusCode statusCode, string json) =>
        new(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

    private sealed class RecordingHandler(
        Func<HttpRequestMessage, HttpResponseMessage> responseFactory) : HttpMessageHandler
    {
        public List<RecordedRequest> Requests { get; } = [];

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            var body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            Requests.Add(new RecordedRequest(
                request.Method,
                request.RequestUri!,
                request.Headers.Authorization,
                body));
            return responseFactory(request);
        }
    }

    private sealed record RecordedRequest(
        HttpMethod Method,
        Uri Uri,
        AuthenticationHeaderValue? Authorization,
        string Body);
}
