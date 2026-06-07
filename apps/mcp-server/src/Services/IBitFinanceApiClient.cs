using BitFinance.MCP.Models;

namespace BitFinance.MCP.Services;

public interface IBitFinanceApiClient
{
    Guid GetOrganizationIdOrDefault(Guid? organizationId);
    Task<List<OrganizationSummaryResponse>> ListOrganizationsAsync(CancellationToken cancellationToken = default);
    Task<OrganizationDetailsResponse> GetOrganizationAsync(Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<UpcomingBillsResponse> GetUpcomingBillsAsync(Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<RecentExpensesResponse> GetRecentExpensesAsync(Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<PagedResponse<BillResponse>> ListBillsAsync(Guid? organizationId = null, int page = 1, int pageSize = 100, DateTimeOffset? from = null, DateTimeOffset? to = null, string? status = null, string? description = null, CancellationToken cancellationToken = default);
    Task<BillResponse> GetBillAsync(Guid billId, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<BillResponse> CreateBillAsync(CreateBillRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<UpdateBillResponse> UpdateBillAsync(Guid billId, UpdateBillRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task DeleteBillAsync(Guid billId, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<UploadDocumentResponse> UploadBillDocumentAsync(Guid billId, string fileName, string base64Content, string fileCategory, Guid? organizationId = null, string? contentType = null, CancellationToken cancellationToken = default);
    Task<DocumentDownloadUrlResponse> GetBillDocumentDownloadUrlAsync(Guid billId, Guid documentId, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task DeleteBillDocumentAsync(Guid billId, Guid documentId, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<PagedResponse<ExpenseResponse>> ListExpensesAsync(Guid? organizationId = null, int page = 1, int pageSize = 20, DateTimeOffset? from = null, DateTimeOffset? to = null, CancellationToken cancellationToken = default);
    Task<ExpenseResponse> GetExpenseAsync(Guid expenseId, Guid? organizationId = null, CancellationToken cancellationToken = default);
    Task<ExpenseResponse> CreateExpenseAsync(CreateExpenseRequest request, Guid? organizationId = null, CancellationToken cancellationToken = default);
}
