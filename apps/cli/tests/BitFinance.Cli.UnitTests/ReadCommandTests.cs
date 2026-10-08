using BitFinance.Cli.Configuration;
using BitFinance.Cli.Errors;
using BitFinance.Cli.Models;
using BitFinance.Cli.Services;
using System.Text.Json;

namespace BitFinance.Cli.UnitTests;

public sealed class ReadCommandTests
{
    public static TheoryData<string[]> OrganizationScopedCommands => new()
    {
        new[] { "organizations", "get" },
        new[] { "dashboard", "upcoming-bills" },
        new[] { "dashboard", "recent-expenses" },
        new[] { "bills", "list" },
        new[] { "bills", "get", "--bill-id", Guid.NewGuid().ToString() },
        new[] { "expenses", "list" },
        new[] { "expenses", "get", "--expense-id", Guid.NewGuid().ToString() }
    };

    [Theory]
    [MemberData(nameof(OrganizationScopedCommands))]
    public async Task OrganizationScopedCommand_MissingOrganizationId_DoesNotCreateApiClient(string[] arguments)
    {
        var factory = new FakeApiClientFactory(new FakeApiClient());
        var result = await RunAsync(arguments, factory);

        Assert.Equal(ExitCodes.InvalidInput, result.ExitCode);
        Assert.Equal(0, factory.CreateCount);
        Assert.Equal(string.Empty, result.StandardOutput);
        using var json = JsonDocument.Parse(result.StandardError);
        Assert.Equal("invalid_arguments", json.RootElement.GetProperty("error").GetProperty("code").GetString());
        Assert.Contains("--organization-id", result.StandardError);
    }

    [Fact]
    public async Task OrganizationsList_WritesApiResponseAsJson()
    {
        var organizationId = Guid.NewGuid();
        var client = new FakeApiClient
        {
            Organizations = [new OrganizationSummaryResponse(organizationId, "Household", "Basic")]
        };
        var result = await RunAsync(["organizations", "list"], new FakeApiClientFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.Equal(string.Empty, result.StandardError);
        using var json = JsonDocument.Parse(result.StandardOutput);
        Assert.Equal(organizationId, json.RootElement[0].GetProperty("id").GetGuid());
        Assert.Equal("Household", json.RootElement[0].GetProperty("name").GetString());
    }

    [Fact]
    public async Task BillsList_UsesExplicitOrganizationAndMcpPagingDefaults()
    {
        var organizationId = Guid.NewGuid();
        var client = new FakeApiClient();

        var result = await RunAsync(
            ["bills", "list", "--organization-id", organizationId.ToString()],
            new FakeApiClientFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.NotNull(client.BillListRequest);
        Assert.Equal(organizationId, client.BillListRequest!.OrganizationId);
        Assert.Equal(1, client.BillListRequest.Page);
        Assert.Equal(100, client.BillListRequest.PageSize);
    }

    [Fact]
    public async Task ExpensesList_ParsesFiltersAndSupportsLowercaseTableOutput()
    {
        var organizationId = Guid.NewGuid();
        var client = new FakeApiClient
        {
            ExpensePage = new ExpensePageResponse
            {
                Data =
                [
                    new ExpenseResponse
                    {
                        Id = Guid.NewGuid(),
                        Description = "Coffee",
                        Category = "Food",
                        Status = "Paid",
                        Amount = 8.5m,
                        OccurredAt = DateTimeOffset.Parse("2026-08-20T10:00:00Z")
                    }
                ]
            }
        };

        var result = await RunAsync(
            [
                "expenses", "list",
                "--organization-id", organizationId.ToString(),
                "--page", "2",
                "--page-size", "30",
                "--from", "2026-08-01T00:00:00-03:00",
                "--status", "Paid",
                "--description", "coffee",
                "--payment-method", "Pix",
                "--output", "table"
            ],
            new FakeApiClientFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.NotNull(client.ExpenseListRequest);
        Assert.Equal(2, client.ExpenseListRequest!.Page);
        Assert.Equal(30, client.ExpenseListRequest.PageSize);
        Assert.Equal("Paid", client.ExpenseListRequest.Status);
        Assert.Equal("coffee", client.ExpenseListRequest.Description);
        Assert.Equal("Pix", client.ExpenseListRequest.PaymentMethod);
        Assert.Contains("Coffee", result.StandardOutput);
        Assert.DoesNotContain("{", result.StandardOutput);
    }

    [Theory]
    [InlineData("not-a-date", null)]
    [InlineData("2026-09-01T00:00:00Z", "2026-08-01T00:00:00Z")]
    public async Task BillsList_InvalidDateInput_DoesNotInvokeApi(string from, string? to)
    {
        var client = new FakeApiClient();
        var arguments = new List<string>
        {
            "bills", "list",
            "--organization-id", Guid.NewGuid().ToString(),
            "--from", from
        };
        if (to is not null)
        {
            arguments.AddRange(["--to", to]);
        }

        var result = await RunAsync(arguments.ToArray(), new FakeApiClientFactory(client));

        Assert.Equal(ExitCodes.InvalidInput, result.ExitCode);
        Assert.Null(client.BillListRequest);
        using var json = JsonDocument.Parse(result.StandardError);
        Assert.Equal("invalid_arguments", json.RootElement.GetProperty("error").GetProperty("code").GetString());
    }

    [Fact]
    public async Task ApiAuthenticationFailure_MapsToStableErrorWithoutExposingToken()
    {
        var client = new FakeApiClient
        {
            ListOrganizationsException = new BitFinanceApiException(
                401,
                "GET",
                "/api/v1/organizations",
                """{"message":"Expired"}""")
        };

        var result = await RunAsync(["organizations", "list"], new FakeApiClientFactory(client));

        Assert.Equal(ExitCodes.AuthenticationFailure, result.ExitCode);
        Assert.Equal(string.Empty, result.StandardOutput);
        using var json = JsonDocument.Parse(result.StandardError);
        var error = json.RootElement.GetProperty("error");
        Assert.Equal("authentication_failed", error.GetProperty("code").GetString());
        Assert.Equal(401, error.GetProperty("httpStatus").GetInt32());
        Assert.DoesNotContain("test-token", result.StandardError);
    }

    private static async Task<RunResult> RunAsync(string[] arguments, IBitFinanceApiClientFactory factory)
    {
        using var standardOutput = new StringWriter();
        using var standardError = new StringWriter();
        var environment = new DictionaryEnvironment(new Dictionary<string, string?>
        {
            [CliConfiguration.ApiBaseUrlVariable] = "https://api.example.com",
            [CliConfiguration.AccessTokenVariable] = "test-token"
        });
        var application = new CliApplication(environment, standardOutput, standardError, factory);

        var exitCode = await application.RunAsync(arguments);
        return new RunResult(exitCode, standardOutput.ToString(), standardError.ToString());
    }

    private sealed record RunResult(int ExitCode, string StandardOutput, string StandardError);

    private sealed class FakeApiClientFactory(IBitFinanceApiClient client) : IBitFinanceApiClientFactory
    {
        public int CreateCount { get; private set; }

        public IBitFinanceApiClient Create(CliConfiguration configuration)
        {
            CreateCount++;
            return client;
        }
    }

    private sealed class FakeApiClient : BitFinanceApiClientStub
    {
        public List<OrganizationSummaryResponse> Organizations { get; init; } = [];
        public Exception? ListOrganizationsException { get; init; }
        public BillListCall? BillListRequest { get; private set; }
        public ExpenseListCall? ExpenseListRequest { get; private set; }
        public ExpensePageResponse ExpensePage { get; init; } = new();

        public override Task<List<OrganizationSummaryResponse>> ListOrganizationsAsync(
            CancellationToken cancellationToken = default) =>
            ListOrganizationsException is null
                ? Task.FromResult(Organizations)
                : Task.FromException<List<OrganizationSummaryResponse>>(ListOrganizationsException);

        public override Task<OrganizationDetailsResponse> GetOrganizationAsync(
            Guid organizationId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new OrganizationDetailsResponse { Id = organizationId });

        public override Task<UpcomingBillsResponse> GetUpcomingBillsAsync(
            Guid organizationId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new UpcomingBillsResponse());

        public override Task<RecentExpensesResponse> GetRecentExpensesAsync(
            Guid organizationId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new RecentExpensesResponse());

        public override Task<PagedResponse<BillResponse>> ListBillsAsync(
            Guid organizationId,
            int page,
            int pageSize,
            DateTimeOffset? from,
            DateTimeOffset? to,
            string? status,
            string? description,
            CancellationToken cancellationToken = default)
        {
            BillListRequest = new BillListCall(
                organizationId,
                page,
                pageSize,
                from,
                to,
                status,
                description);
            return Task.FromResult(new PagedResponse<BillResponse>());
        }

        public override Task<BillResponse> GetBillAsync(
            Guid organizationId,
            Guid billId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new BillResponse { Id = billId });

        public override Task<ExpensePageResponse> ListExpensesAsync(
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
            ExpenseListRequest = new ExpenseListCall(
                organizationId,
                page,
                pageSize,
                from,
                to,
                status,
                description,
                paymentMethod);
            return Task.FromResult(ExpensePage);
        }

        public override Task<ExpenseResponse> GetExpenseAsync(
            Guid organizationId,
            Guid expenseId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new ExpenseResponse { Id = expenseId });
    }

    private sealed record BillListCall(
        Guid OrganizationId,
        int Page,
        int PageSize,
        DateTimeOffset? From,
        DateTimeOffset? To,
        string? Status,
        string? Description);

    private sealed record ExpenseListCall(
        Guid OrganizationId,
        int Page,
        int PageSize,
        DateTimeOffset? From,
        DateTimeOffset? To,
        string? Status,
        string? Description,
        string? PaymentMethod);
}
