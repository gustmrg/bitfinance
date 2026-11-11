namespace BitFinance.Data.Repositories;

/// <summary>
/// Totals over every bill that matches a listing's filters, not only the returned page.
/// </summary>
/// <param name="ToPay">Amount due across bills that are neither paid nor cancelled.</param>
/// <param name="Overdue">Amount due across unsettled bills that are overdue or past their due date.</param>
/// <param name="NextSevenDays">Amount due across unsettled, not overdue bills due from today through the next seven days.</param>
/// <param name="Paid">Amount paid across paid bills, falling back to the amount due when no paid amount was recorded.</param>
public sealed record BillListSummary(decimal ToPay, decimal Overdue, decimal NextSevenDays, decimal Paid)
{
    public static readonly BillListSummary Empty = new(0, 0, 0, 0);
}
