namespace BitFinance.Business.Enums;

/// <summary>
/// Represents the processing status of an expense.
/// </summary>
public enum ExpenseStatus
{
    /// <summary>
    /// The expense has been recorded but not yet processed.
    /// </summary>
    Pending = 0,

    /// <summary>
    /// The expense has been paid or reimbursed.
    /// </summary>
    Paid = 1,

    /// <summary>
    /// The expense has been cancelled.
    /// </summary>
    Cancelled = 2
}
