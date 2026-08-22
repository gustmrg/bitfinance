using BitFinance.Cli.Models;
using BitFinance.Cli.Output;
using System.Globalization;

namespace BitFinance.Cli.Commands;

internal static class ReadCommandTables
{
    public static TableData Organizations(IEnumerable<OrganizationSummaryResponse> organizations) =>
        Table(
            ["Id", "Name", "Plan"],
            organizations.Select(item => Row(item.Id, item.Name, item.PlanTier)));

    public static TableData Organization(OrganizationDetailsResponse organization) =>
        Table(
            ["Field", "Value"],
            [
                Row("Id", organization.Id),
                Row("Name", organization.Name),
                Row("Plan", organization.PlanTier),
                Row("Plan expires", organization.PlanExpiresAt),
                Row("Members", organization.Members.Count)
            ]);

    public static TableData Bills(IEnumerable<BillResponse> bills) =>
        Table(
            ["Id", "Description", "Category", "Status", "Amount due", "Due date"],
            bills.Select(item => Row(
                item.Id,
                item.Description,
                item.Category,
                item.Status,
                item.AmountDue,
                item.DueDate)));

    public static TableData Bill(BillResponse bill) =>
        Bills([bill]);

    public static TableData Expenses(IEnumerable<ExpenseResponse> expenses) =>
        Table(
            ["Id", "Description", "Category", "Status", "Amount", "Occurred at"],
            expenses.Select(item => Row(
                item.Id,
                item.Description,
                item.Category,
                item.Status,
                item.Amount,
                item.OccurredAt)));

    public static TableData Expense(ExpenseResponse expense) =>
        Expenses([expense]);

    public static TableData UpcomingBills(UpcomingBillsResponse response) =>
        Table(
            ["Id", "Description", "Category", "Status", "Amount due", "Due date"],
            response.Data.Select(item => Row(
                item.Id,
                item.Description,
                item.Category,
                item.Status,
                item.AmountDue,
                item.DueDate)));

    public static TableData RecentExpenses(RecentExpensesResponse response) =>
        Table(
            ["Id", "Description", "Category", "Amount", "Date"],
            response.Data.Select(item => Row(
                item.Id,
                item.Description,
                item.Category,
                item.Amount,
                item.Date)));

    private static TableData Table(IEnumerable<string> headers, IEnumerable<IReadOnlyList<string>> rows) =>
        new(headers.ToArray(), rows.ToArray());

    private static IReadOnlyList<string> Row(params object?[] values) =>
        values.Select(Format).ToArray();

    private static string Format(object? value) =>
        value switch
        {
            null => string.Empty,
            DateTimeOffset date => date.ToString("O", CultureInfo.InvariantCulture),
            decimal number => number.ToString("0.00", CultureInfo.InvariantCulture),
            IFormattable formattable => formattable.ToString(null, CultureInfo.InvariantCulture),
            _ => value.ToString() ?? string.Empty
        };
}
