using BitFinance.Cli.Models;

namespace BitFinance.Cli.Services;

public interface IBitFinanceApiClient
{
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
}
