namespace BitFinance.API.Models.Response;

public sealed record BillSummaryResponse(decimal ToPay, decimal Overdue, decimal NextSevenDays, decimal Paid);

public sealed class BillPageResponse(
    List<GetBillResponse> data,
    int page,
    int pageSize,
    int totalRecords,
    int totalPages,
    BillSummaryResponse summary)
    : PagedResponse<GetBillResponse>(data, page, pageSize, totalRecords, totalPages)
{
    public BillSummaryResponse Summary { get; } = summary;
}
