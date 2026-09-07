using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public record DashboardSummaryResponse(
    decimal? MonthlyBudget,
    decimal SpentThisMonth,
    decimal? RemainingBudget,
    int? SpentPercentage,
    decimal UpcomingBillsAmount,
    int UpcomingBillsCount);

public record UpcomingBillsResponse(List<DashboardBillResponse> Data);

public record RecentExpensesResponse(List<DashboardExpenseResponse> Data);

public class DashboardBillResponse
{
    public Guid Id { get; set; }

    public string Description { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BillCategory Category { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BillStatus Status { get; set; }

    public decimal AmountDue { get; set; }

    public DateTimeOffset CreatedAt { get; set; }

    public DateOnly DueDate { get; set; }
}

public class DashboardExpenseResponse
{
    public Guid Id { get; set; }

    public string Description { get; set; } = null!;

    public decimal Amount { get; set; }

    public DateTimeOffset Date { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExpenseCategory Category { get; set; }
}
