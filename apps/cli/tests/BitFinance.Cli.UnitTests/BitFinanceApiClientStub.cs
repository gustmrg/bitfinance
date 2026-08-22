using BitFinance.Cli.Models;
using BitFinance.Cli.Services;

namespace BitFinance.Cli.UnitTests;

internal abstract class BitFinanceApiClientStub : IBitFinanceApiClient
{
    public virtual Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult(new CurrentUserResponse("test-user"));

    public virtual Task<List<OrganizationSummaryResponse>> ListOrganizationsAsync(CancellationToken cancellationToken = default) =>
        Task.FromResult<List<OrganizationSummaryResponse>>([]);

    public virtual Task<OrganizationDetailsResponse> GetOrganizationAsync(Guid organizationId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new OrganizationDetailsResponse { Id = organizationId });

    public virtual Task<UpcomingBillsResponse> GetUpcomingBillsAsync(Guid organizationId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new UpcomingBillsResponse());

    public virtual Task<RecentExpensesResponse> GetRecentExpensesAsync(Guid organizationId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new RecentExpensesResponse());

    public virtual Task<PagedResponse<BillResponse>> ListBillsAsync(
        Guid organizationId, int page, int pageSize, DateTimeOffset? from, DateTimeOffset? to,
        string? status, string? description, CancellationToken cancellationToken = default) =>
        Task.FromResult(new PagedResponse<BillResponse>());

    public virtual Task<BillResponse> GetBillAsync(Guid organizationId, Guid billId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new BillResponse { Id = billId });

    public virtual Task<BillResponse> CreateBillAsync(Guid organizationId, CreateBillRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new BillResponse());

    public virtual Task<UpdateBillResponse> UpdateBillAsync(Guid organizationId, Guid billId, UpdateBillRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new UpdateBillResponse { Id = billId });

    public virtual Task DeleteBillAsync(Guid organizationId, Guid billId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public virtual Task StopBillSeriesAsync(Guid organizationId, Guid seriesId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public virtual Task<UploadDocumentResponse> UploadBillDocumentAsync(
        Guid organizationId, Guid billId, Stream content, string fileName, string contentType,
        string fileCategory, CancellationToken cancellationToken = default) =>
        Task.FromResult(new UploadDocumentResponse());

    public virtual Task<DocumentDownloadUrlResponse> GetBillDocumentDownloadUrlAsync(
        Guid organizationId, Guid billId, Guid documentId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new DocumentDownloadUrlResponse(string.Empty, string.Empty, string.Empty, default));

    public virtual Task DeleteBillDocumentAsync(Guid organizationId, Guid billId, Guid documentId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;

    public virtual Task<ExpensePageResponse> ListExpensesAsync(
        Guid organizationId, int page, int pageSize, DateTimeOffset? from, DateTimeOffset? to,
        string? status, string? description, string? paymentMethod, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExpensePageResponse());

    public virtual Task<ExpenseResponse> GetExpenseAsync(Guid organizationId, Guid expenseId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExpenseResponse { Id = expenseId });

    public virtual Task<ExpenseResponse> CreateExpenseAsync(Guid organizationId, CreateExpenseRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExpenseResponse());

    public virtual Task<ExpenseResponse> UpdateExpenseAsync(Guid organizationId, Guid expenseId, UpdateExpenseRequest request, CancellationToken cancellationToken = default) =>
        Task.FromResult(new ExpenseResponse { Id = expenseId });

    public virtual Task<UploadDocumentResponse> UploadExpenseDocumentAsync(
        Guid organizationId, Guid expenseId, Stream content, string fileName, string contentType,
        string fileCategory, CancellationToken cancellationToken = default) =>
        Task.FromResult(new UploadDocumentResponse());

    public virtual Task<DocumentDownloadUrlResponse> GetExpenseDocumentDownloadUrlAsync(
        Guid organizationId, Guid expenseId, Guid documentId, CancellationToken cancellationToken = default) =>
        Task.FromResult(new DocumentDownloadUrlResponse(string.Empty, string.Empty, string.Empty, default));

    public virtual Task DeleteExpenseDocumentAsync(Guid organizationId, Guid expenseId, Guid documentId, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
