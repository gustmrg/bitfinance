namespace BitFinance.Business.Enums;

/// <summary>
/// Narrows a bill listing to one-time bills or to occurrences of one kind of series.
/// </summary>
public enum BillTypeFilter
{
    /// <summary>
    /// Bills that do not belong to a series.
    /// </summary>
    OneTime = 0,

    /// <summary>
    /// Occurrences of a series with no fixed number of occurrences.
    /// </summary>
    Recurring = 1,

    /// <summary>
    /// Occurrences of a series with a fixed number of occurrences.
    /// </summary>
    Installment = 2
}
