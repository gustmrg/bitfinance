using BitFinance.Cli.Configuration;
using BitFinance.Cli.Errors;
using BitFinance.Cli.Models;
using BitFinance.Cli.Services;
using System.Text.Json;

namespace BitFinance.Cli.UnitTests;

public sealed class MutationCommandTests
{
    public static TheoryData<string[]> UnconfirmedDestructiveCommands => new()
    {
        new[] { "bills", "delete", "--organization-id", Guid.NewGuid().ToString(), "--bill-id", Guid.NewGuid().ToString() },
        new[] { "bills", "stop-series", "--organization-id", Guid.NewGuid().ToString(), "--series-id", Guid.NewGuid().ToString() },
        new[] { "bills", "documents", "delete", "--organization-id", Guid.NewGuid().ToString(), "--bill-id", Guid.NewGuid().ToString(), "--document-id", Guid.NewGuid().ToString() },
        new[] { "expenses", "documents", "delete", "--organization-id", Guid.NewGuid().ToString(), "--expense-id", Guid.NewGuid().ToString(), "--document-id", Guid.NewGuid().ToString() }
    };

    [Theory]
    [MemberData(nameof(UnconfirmedDestructiveCommands))]
    public async Task DestructiveCommand_WithoutConfirm_DoesNotCreateApiClient(string[] arguments)
    {
        var factory = new FakeFactory(new MutationApiClient());

        var result = await RunAsync(arguments, factory);

        Assert.Equal(ExitCodes.InvalidInput, result.ExitCode);
        Assert.Equal(0, factory.CreateCount);
        Assert.Contains("--confirm", result.StandardError);
    }

    [Fact]
    public async Task CreateBill_ParsesRecurringBillUsingInvariantValues()
    {
        var organizationId = Guid.NewGuid();
        var client = new MutationApiClient();

        var result = await RunAsync(
            [
                "bills", "create",
                "--organization-id", organizationId.ToString(),
                "--description", "Rent",
                "--category", "housing",
                "--status", "upcoming",
                "--due-date", "2026-09-10T00:00:00-03:00",
                "--amount-due", "1500.25",
                "--frequency", "monthly",
                "--installments", "10",
                "--notes", "Apartment"
            ],
            new FakeFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.NotNull(client.CreatedBill);
        Assert.Equal(organizationId, client.CreatedBill!.OrganizationId);
        Assert.Equal(1500.25m, client.CreatedBill.Request.AmountDue);
        Assert.Equal(BillFrequency.Monthly, client.CreatedBill.Request.Frequency);
        Assert.Equal(10, client.CreatedBill.Request.Installments);
        Assert.Equal(TimeSpan.FromHours(-3), client.CreatedBill.Request.DueDate.Offset);
    }

    [Theory]
    [InlineData("--installments", "2")]
    [InlineData("--amount-due", "12,34.56")]
    public async Task CreateBill_InvalidCombinationOrDecimal_DoesNotInvokeApi(string option, string value)
    {
        var client = new MutationApiClient();
        var arguments = new List<string>
        {
            "bills", "create",
            "--organization-id", Guid.NewGuid().ToString(),
            "--description", "Rent",
            "--category", "Housing",
            "--status", "Upcoming",
            "--due-date", "2026-09-10T00:00:00Z",
            "--amount-due", "1500"
        };
        arguments.AddRange([option, value]);

        var result = await RunAsync(arguments.ToArray(), new FakeFactory(client));

        Assert.Equal(ExitCodes.InvalidInput, result.ExitCode);
        Assert.Null(client.CreatedBill);
    }

    [Fact]
    public async Task CreateExpense_ResolvesCurrentTokenOwnerWhenCreatedByIsOmitted()
    {
        var organizationId = Guid.NewGuid();
        var client = new MutationApiClient { CurrentUserId = "user-from-token" };

        var result = await RunAsync(
            [
                "expenses", "create",
                "--organization-id", organizationId.ToString(),
                "--description", "Lunch",
                "--category", "Food",
                "--amount", "42.50",
                "--status", "Paid",
                "--payment-method", "Pix"
            ],
            new FakeFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.Equal(1, client.CurrentUserCalls);
        Assert.Equal("user-from-token", client.CreatedExpense?.Request.CreatedBy);
        Assert.Equal("Pix", client.CreatedExpense?.Request.PaymentMethod);
    }

    [Fact]
    public async Task CreateExpense_ExplicitCreatedBySkipsCurrentUserRequest()
    {
        var client = new MutationApiClient();

        var result = await RunAsync(
            [
                "expenses", "create",
                "--organization-id", Guid.NewGuid().ToString(),
                "--description", "Lunch",
                "--category", "Food",
                "--amount", "42.50",
                "--status", "Paid",
                "--created-by", "explicit-user"
            ],
            new FakeFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.Equal(0, client.CurrentUserCalls);
        Assert.Equal("explicit-user", client.CreatedExpense?.Request.CreatedBy);
    }

    [Fact]
    public async Task UpdateExpense_PreservesEmptyValuesForClearSemantics()
    {
        var client = new MutationApiClient();

        var result = await RunAsync(
            [
                "expenses", "update",
                "--organization-id", Guid.NewGuid().ToString(),
                "--expense-id", Guid.NewGuid().ToString(),
                "--description", "Lunch",
                "--category", "Food",
                "--amount", "45.00",
                "--status", "Paid",
                "--occurred-at", "2026-08-20T12:00:00Z",
                "--notes", "",
                "--payment-method", ""
            ],
            new FakeFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.Equal(string.Empty, client.UpdatedExpense?.Request.Notes);
        Assert.Equal(string.Empty, client.UpdatedExpense?.Request.PaymentMethod);
    }

    [Fact]
    public async Task UploadDocument_ValidatesAndStreamsLocalFile()
    {
        var filePath = Path.Combine(Path.GetTempPath(), $"bitfinance-{Guid.NewGuid():N}.pdf");
        await File.WriteAllBytesAsync(filePath, [1, 2, 3, 4]);
        try
        {
            var client = new MutationApiClient();

            var result = await RunAsync(
                [
                    "bills", "documents", "upload",
                    "--organization-id", Guid.NewGuid().ToString(),
                    "--bill-id", Guid.NewGuid().ToString(),
                    "--file", filePath,
                    "--file-category", "Receipt"
                ],
                new FakeFactory(client));

            Assert.Equal(ExitCodes.Success, result.ExitCode);
            Assert.NotNull(client.UploadedBillDocument);
            Assert.Equal(Path.GetFileName(filePath), client.UploadedBillDocument!.FileName);
            Assert.Equal("application/pdf", client.UploadedBillDocument.ContentType);
            Assert.Equal("Receipt", client.UploadedBillDocument.FileCategory);
            Assert.Equal(4, client.UploadedBillDocument.Length);
        }
        finally
        {
            File.Delete(filePath);
        }
    }

    [Fact]
    public async Task UploadDocument_UnsupportedExtension_DoesNotInvokeApi()
    {
        var filePath = Path.Combine(Path.GetTempPath(), $"bitfinance-{Guid.NewGuid():N}.txt");
        await File.WriteAllTextAsync(filePath, "not supported");
        try
        {
            var client = new MutationApiClient();
            var result = await RunAsync(
                [
                    "expenses", "documents", "upload",
                    "--organization-id", Guid.NewGuid().ToString(),
                    "--expense-id", Guid.NewGuid().ToString(),
                    "--file", filePath,
                    "--file-category", "Receipt"
                ],
                new FakeFactory(client));

            Assert.Equal(ExitCodes.InvalidInput, result.ExitCode);
            Assert.Null(client.UploadedExpenseDocument);
        }
        finally
        {
            File.Delete(filePath);
        }
    }

    [Fact]
    public async Task ConfirmedDelete_ReturnsExplicitSuccessObject()
    {
        var billId = Guid.NewGuid();
        var client = new MutationApiClient();

        var result = await RunAsync(
            [
                "bills", "delete",
                "--organization-id", Guid.NewGuid().ToString(),
                "--bill-id", billId.ToString(),
                "--confirm"
            ],
            new FakeFactory(client));

        Assert.Equal(ExitCodes.Success, result.ExitCode);
        Assert.Equal(billId, client.DeletedBillId);
        using var json = JsonDocument.Parse(result.StandardOutput);
        Assert.True(json.RootElement.GetProperty("deleted").GetBoolean());
        Assert.Equal(billId, json.RootElement.GetProperty("billId").GetGuid());
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

    private sealed class FakeFactory(IBitFinanceApiClient client) : IBitFinanceApiClientFactory
    {
        public int CreateCount { get; private set; }

        public IBitFinanceApiClient Create(CliConfiguration configuration)
        {
            CreateCount++;
            return client;
        }
    }

    private sealed class MutationApiClient : BitFinanceApiClientStub
    {
        public string CurrentUserId { get; init; } = "test-user";
        public int CurrentUserCalls { get; private set; }
        public BillCall? CreatedBill { get; private set; }
        public ExpenseCall? CreatedExpense { get; private set; }
        public UpdateExpenseCall? UpdatedExpense { get; private set; }
        public UploadCall? UploadedBillDocument { get; private set; }
        public UploadCall? UploadedExpenseDocument { get; private set; }
        public Guid? DeletedBillId { get; private set; }

        public override Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default)
        {
            CurrentUserCalls++;
            return Task.FromResult(new CurrentUserResponse(CurrentUserId));
        }

        public override Task<BillResponse> CreateBillAsync(
            Guid organizationId,
            CreateBillRequest request,
            CancellationToken cancellationToken = default)
        {
            CreatedBill = new BillCall(organizationId, request);
            return Task.FromResult(new BillResponse { Description = request.Description });
        }

        public override Task<ExpenseResponse> CreateExpenseAsync(
            Guid organizationId,
            CreateExpenseRequest request,
            CancellationToken cancellationToken = default)
        {
            CreatedExpense = new ExpenseCall(organizationId, request);
            return Task.FromResult(new ExpenseResponse
            {
                Description = request.Description,
                OccurredAt = request.OccurredAt ?? DateTimeOffset.UtcNow
            });
        }

        public override Task<ExpenseResponse> UpdateExpenseAsync(
            Guid organizationId,
            Guid expenseId,
            UpdateExpenseRequest request,
            CancellationToken cancellationToken = default)
        {
            UpdatedExpense = new UpdateExpenseCall(organizationId, expenseId, request);
            return Task.FromResult(new ExpenseResponse { Id = expenseId, OccurredAt = request.OccurredAt });
        }

        public override async Task<UploadDocumentResponse> UploadBillDocumentAsync(
            Guid organizationId,
            Guid billId,
            Stream content,
            string fileName,
            string contentType,
            string fileCategory,
            CancellationToken cancellationToken = default)
        {
            UploadedBillDocument = new UploadCall(
                organizationId, billId, fileName, contentType, fileCategory, await ReadLengthAsync(content));
            return new UploadDocumentResponse { FileName = fileName, ContentType = contentType, FileCategory = fileCategory };
        }

        public override async Task<UploadDocumentResponse> UploadExpenseDocumentAsync(
            Guid organizationId,
            Guid expenseId,
            Stream content,
            string fileName,
            string contentType,
            string fileCategory,
            CancellationToken cancellationToken = default)
        {
            UploadedExpenseDocument = new UploadCall(
                organizationId, expenseId, fileName, contentType, fileCategory, await ReadLengthAsync(content));
            return new UploadDocumentResponse { FileName = fileName, ContentType = contentType, FileCategory = fileCategory };
        }

        public override Task DeleteBillAsync(Guid organizationId, Guid billId, CancellationToken cancellationToken = default)
        {
            DeletedBillId = billId;
            return Task.CompletedTask;
        }

        private static async Task<int> ReadLengthAsync(Stream content)
        {
            using var memory = new MemoryStream();
            await content.CopyToAsync(memory);
            return checked((int)memory.Length);
        }
    }

    private sealed record BillCall(Guid OrganizationId, CreateBillRequest Request);
    private sealed record ExpenseCall(Guid OrganizationId, CreateExpenseRequest Request);
    private sealed record UpdateExpenseCall(Guid OrganizationId, Guid ExpenseId, UpdateExpenseRequest Request);
    private sealed record UploadCall(
        Guid OrganizationId,
        Guid OwnerId,
        string FileName,
        string ContentType,
        string FileCategory,
        int Length);
}
