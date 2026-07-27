using BitFinance.API.Models;

namespace BitFinance.API.Models.Response;

public sealed record ExpenseSummaryResponse(decimal TotalAmount, decimal AverageAmount);

public sealed class ExpensePageResponse(
    List<GetExpenseResponse> data,
    int page,
    int pageSize,
    int totalRecords,
    int totalPages,
    ExpenseSummaryResponse summary)
    : PagedResponse<GetExpenseResponse>(data, page, pageSize, totalRecords, totalPages)
{
    public ExpenseSummaryResponse Summary { get; } = summary;
}
