using System.ComponentModel;
using BitFinance.MCP.Models;
using BitFinance.MCP.Services;
using ModelContextProtocol.Server;

namespace BitFinance.MCP.Tools;

[McpServerToolType]
public sealed class BitFinanceTools
{
    private const string BillCategories = "Housing, Transportation, Food, Utilities, Clothing, Healthcare, Insurance, Personal, Debt, Savings, Education, Entertainment, Miscellaneous, Subscriptions, Taxes, Pets";
    private const string BillStatuses = "Created, Due, Paid, Overdue, Cancelled, Upcoming";
    private const string ExpenseCategories = "Housing, Transportation, Food, Utilities, Clothing, Healthcare, Insurance, Personal, Debt, Savings, Education, Entertainment, Travel, Pets, Gifts, Miscellaneous, Subscriptions, Taxes";
    private const string ExpenseStatuses = "Pending, Paid, Cancelled";

    private readonly IBitFinanceApiClient _apiClient;
    private readonly IBitFinanceTokenProvider _tokenProvider;

    public BitFinanceTools(IBitFinanceApiClient apiClient, IBitFinanceTokenProvider tokenProvider)
    {
        _apiClient = apiClient;
        _tokenProvider = tokenProvider;
    }

    [McpServerTool]
    [Description("Lists organizations the authenticated BitFinance agent user can access.")]
    public Task<List<OrganizationSummaryResponse>> bitfinance_list_organizations(CancellationToken cancellationToken = default)
    {
        return _apiClient.ListOrganizationsAsync(cancellationToken);
    }

    [McpServerTool]
    [Description("Gets organization details and members. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<OrganizationDetailsResponse> bitfinance_get_organization(
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.GetOrganizationAsync(organizationId, cancellationToken);
    }

    [McpServerTool]
    [Description("Gets upcoming bills for the organization dashboard. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<UpcomingBillsResponse> bitfinance_get_upcoming_bills(
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.GetUpcomingBillsAsync(organizationId, cancellationToken);
    }

    [McpServerTool]
    [Description("Gets recent expenses for the organization dashboard. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<RecentExpensesResponse> bitfinance_get_recent_expenses(
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.GetRecentExpensesAsync(organizationId, cancellationToken);
    }

    [McpServerTool]
    [Description("Lists bills for an organization with optional paging, date, status, and description filtering. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<PagedResponse<BillResponse>> bitfinance_list_bills(
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        [Description("Page number, starting at 1.")] int page = 1,
        [Description("Page size. Default is 20.")] int pageSize = 20,
        [Description("Optional start date/time filter as ISO 8601.")] DateTimeOffset? from = null,
        [Description("Optional end date/time filter as ISO 8601.")] DateTimeOffset? to = null,
        [Description("Optional comma-separated statuses to filter by (created, due, paid, overdue, cancelled, upcoming).")] string? status = null,
        [Description("Optional description search text (case-insensitive contains).")] string? description = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.ListBillsAsync(organizationId, page, pageSize, from, to, status, description, cancellationToken);
    }

    [McpServerTool]
    [Description("Gets a bill by ID. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<BillResponse> bitfinance_get_bill(
        [Description("Bill ID.")] Guid billId,
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.GetBillAsync(billId, organizationId, cancellationToken);
    }

    [McpServerTool]
    [Description("Creates a bill. Valid categories: " + BillCategories + ". Valid statuses: " + BillStatuses + ".")]
    public Task<BillResponse> bitfinance_create_bill(
        [Description("Bill description.")] string description,
        [Description("Bill category.")] string category,
        [Description("Bill status.")] string status,
        [Description("Bill due date/time as ISO 8601.")] DateTimeOffset dueDate,
        [Description("Amount due.")] decimal amountDue,
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        [Description("Optional payment date/time as ISO 8601.")] DateTimeOffset? paymentDate = null,
        [Description("Optional amount already paid.")] decimal? amountPaid = null,
        CancellationToken cancellationToken = default)
    {
        var request = new CreateBillRequest(description, category, status, dueDate, paymentDate, amountDue, amountPaid);
        return _apiClient.CreateBillAsync(request, organizationId, cancellationToken);
    }

    [McpServerTool]
    [Description("Lists expenses for an organization with optional paging and date filtering. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<PagedResponse<ExpenseResponse>> bitfinance_list_expenses(
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        [Description("Page number, starting at 1.")] int page = 1,
        [Description("Page size. Default is 20.")] int pageSize = 20,
        [Description("Optional start date/time filter as ISO 8601.")] DateTimeOffset? from = null,
        [Description("Optional end date/time filter as ISO 8601.")] DateTimeOffset? to = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.ListExpensesAsync(organizationId, page, pageSize, from, to, cancellationToken);
    }

    [McpServerTool]
    [Description("Gets an expense by ID. Uses BITFINANCE_DEFAULT_ORGANIZATION_ID when organizationId is omitted.")]
    public Task<ExpenseResponse> bitfinance_get_expense(
        [Description("Expense ID.")] Guid expenseId,
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        CancellationToken cancellationToken = default)
    {
        return _apiClient.GetExpenseAsync(expenseId, organizationId, cancellationToken);
    }

    [McpServerTool]
    [Description("Creates an expense. Valid categories: " + ExpenseCategories + ". Valid statuses: " + ExpenseStatuses + ". Uses the authenticated agent user as createdBy when createdBy is omitted.")]
    public async Task<ExpenseResponse> bitfinance_create_expense(
        [Description("Expense description.")] string description,
        [Description("Expense category.")] string category,
        [Description("Expense amount.")] decimal amount,
        [Description("Expense status.")] string status,
        [Description("Optional organization ID. Defaults to BITFINANCE_DEFAULT_ORGANIZATION_ID.")] Guid? organizationId = null,
        [Description("Optional occurrence date/time as ISO 8601. Defaults to backend current UTC time when omitted.")] DateTimeOffset? occurredAt = null,
        [Description("Optional BitFinance user ID to set as creator. Defaults to the authenticated agent user.")] string? createdBy = null,
        CancellationToken cancellationToken = default)
    {
        var resolvedCreatedBy = string.IsNullOrWhiteSpace(createdBy)
            ? await _tokenProvider.GetAgentUserIdAsync(cancellationToken)
            : createdBy;

        var request = new CreateExpenseRequest(description, category, amount, status, occurredAt, resolvedCreatedBy);
        return await _apiClient.CreateExpenseAsync(request, organizationId, cancellationToken);
    }
}
