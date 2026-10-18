using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class ReportsService : IReportsService
{
    private readonly IExpensesRepository _expensesRepository;
    private readonly IBillsRepository _billsRepository;

    public ReportsService(IExpensesRepository expensesRepository, IBillsRepository billsRepository)
    {
        _expensesRepository = expensesRepository;
        _billsRepository = billsRepository;
    }

    public async Task<ReportResponse> GetReportAsync(Organization organization, int months)
    {
        var today = organization.GetCurrentLocalDate();
        var from = new DateOnly(today.Year, today.Month, 1).AddMonths(-(months - 1));
        var to = new DateOnly(today.Year, today.Month, 1).AddMonths(1).AddDays(-1);

        // The query window is padded by a day on each side so the local-date filter below catches every time zone offset.
        var startUtc = DateTime.SpecifyKind(from.AddDays(-1).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);
        var endUtc = DateTime.SpecifyKind(to.AddDays(2).ToDateTime(TimeOnly.MinValue), DateTimeKind.Utc);

        var expenses = (await _expensesRepository.GetForReportAsync(organization.Id, startUtc, endUtc))
            .Select(expense => (Expense: expense, Date: organization.GetLocalDate(expense.OccurredAt)))
            .Where(item => item.Date >= from && item.Date <= to)
            .ToList();
        var bills = await _billsRepository.GetForReportAsync(organization.Id, from, to);

        var monthly = Enumerable.Range(0, months)
            .Select(offset => from.AddMonths(offset))
            .Select(month => new MonthlyReportItem(
                month.Year,
                month.Month,
                expenses
                    .Where(item => item.Date.Year == month.Year && item.Date.Month == month.Month)
                    .Sum(item => item.Expense.Amount),
                bills
                    .Where(bill => bill.DueDate.Year == month.Year && bill.DueDate.Month == month.Month)
                    .Sum(bill => bill.AmountDue),
                bills
                    .Where(bill => bill.Status == BillStatus.Paid
                                   && bill.DueDate.Year == month.Year
                                   && bill.DueDate.Month == month.Month)
                    .Sum(bill => bill.AmountPaid ?? bill.AmountDue)))
            .ToList();

        var expenseCategories = expenses
            .GroupBy(item => item.Expense.Category.ToString())
            .Select(group => new CategoryReportItem(group.Key, group.Sum(item => item.Expense.Amount), group.Count()))
            .OrderByDescending(item => item.Total)
            .ToList();

        var billCategories = bills
            .GroupBy(bill => bill.Category.ToString())
            .Select(group => new CategoryReportItem(group.Key, group.Sum(bill => bill.AmountDue), group.Count()))
            .OrderByDescending(item => item.Total)
            .ToList();

        return new ReportResponse(from, to, organization.Budget?.Amount, monthly, expenseCategories, billCategories);
    }
}
