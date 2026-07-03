namespace BitFinance.Business.Enums;

/// <summary>
/// Indicates whether a <see cref="BillSeries"/> generates recurring bills indefinitely
/// or a fixed number of installment occurrences.
/// </summary>
public enum BillSeriesType
{
    /// <summary>
    /// Bills recur indefinitely using a 12-month rolling generation horizon.
    /// </summary>
    Recurring = 1,

    /// <summary>
    /// Bills are generated for a fixed number of installments.
    /// </summary>
    Installment = 2
}
