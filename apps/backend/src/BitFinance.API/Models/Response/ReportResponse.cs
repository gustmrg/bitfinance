namespace BitFinance.API.Models.Response;

public record ReportResponse(
    DateOnly From,
    DateOnly To,
    decimal? MonthlyBudget,
    List<MonthlyReportItem> Months,
    List<CategoryReportItem> ExpenseCategories,
    List<CategoryReportItem> BillCategories);

public record MonthlyReportItem(
    int Year,
    int Month,
    decimal ExpensesTotal,
    decimal BillsTotal,
    decimal BillsPaidTotal);

public record CategoryReportItem(string Category, decimal Total, int Count);
