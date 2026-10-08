using BitFinance.Cli.Models;

namespace BitFinance.Cli.Services;

public interface IBitFinanceApiClient
{
    Task<CurrentUserResponse> GetCurrentUserAsync(CancellationToken cancellationToken = default);

    Task<List<OrganizationSummaryResponse>> ListOrganizationsAsync(CancellationToken cancellationToken = default);

    Task<OrganizationDetailsResponse> GetOrganizationAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default);

    Task<UpcomingBillsResponse> GetUpcomingBillsAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default);

    Task<RecentExpensesResponse> GetRecentExpensesAsync(
        Guid organizationId,
        CancellationToken cancellationToken = default);

    Task<PagedResponse<BillResponse>> ListBillsAsync(
        Guid organizationId,
        int page,
        int pageSize,
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? status,
        string? description,
        CancellationToken cancellationToken = default);

    Task<BillResponse> GetBillAsync(
        Guid organizationId,
        Guid billId,
        CancellationToken cancellationToken = default);

    Task<BillResponse> CreateBillAsync(
        Guid organizationId,
        CreateBillRequest request,
        CancellationToken cancellationToken = default);

    Task<UpdateBillResponse> UpdateBillAsync(
        Guid organizationId,
        Guid billId,
        UpdateBillRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteBillAsync(
        Guid organizationId,
        Guid billId,
        CancellationToken cancellationToken = default);

    Task StopBillSeriesAsync(
        Guid organizationId,
        Guid seriesId,
        CancellationToken cancellationToken = default);

    Task<UploadDocumentResponse> UploadBillDocumentAsync(
        Guid organizationId,
        Guid billId,
        Stream content,
        string fileName,
        string contentType,
        string fileCategory,
        CancellationToken cancellationToken = default);

    Task<DocumentDownloadUrlResponse> GetBillDocumentDownloadUrlAsync(
        Guid organizationId,
        Guid billId,
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task DeleteBillDocumentAsync(
        Guid organizationId,
        Guid billId,
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<ExpensePageResponse> ListExpensesAsync(
        Guid organizationId,
        int page,
        int pageSize,
        DateTimeOffset? from,
        DateTimeOffset? to,
        string? status,
        string? description,
        string? paymentMethod,
        CancellationToken cancellationToken = default);

    Task<ExpenseResponse> GetExpenseAsync(
        Guid organizationId,
        Guid expenseId,
        CancellationToken cancellationToken = default);

    Task<ExpenseResponse> CreateExpenseAsync(
        Guid organizationId,
        CreateExpenseRequest request,
        CancellationToken cancellationToken = default);

    Task<ExpenseResponse> UpdateExpenseAsync(
        Guid organizationId,
        Guid expenseId,
        UpdateExpenseRequest request,
        CancellationToken cancellationToken = default);

    Task<UploadDocumentResponse> UploadExpenseDocumentAsync(
        Guid organizationId,
        Guid expenseId,
        Stream content,
        string fileName,
        string contentType,
        string fileCategory,
        CancellationToken cancellationToken = default);

    Task<DocumentDownloadUrlResponse> GetExpenseDocumentDownloadUrlAsync(
        Guid organizationId,
        Guid expenseId,
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task DeleteExpenseDocumentAsync(
        Guid organizationId,
        Guid expenseId,
        Guid documentId,
        CancellationToken cancellationToken = default);
}
