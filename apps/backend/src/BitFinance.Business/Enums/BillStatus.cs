namespace BitFinance.Business.Enums;

/// <summary>
/// Represents the lifecycle status of a bill.
/// </summary>
public enum BillStatus
{
    /// <summary>
    /// The bill has been created but is not yet due.
    /// </summary>
    Created = 0,

    /// <summary>
    /// The bill is currently due for payment.
    /// </summary>
    Due = 1,

    /// <summary>
    /// The bill has been fully paid.
    /// </summary>
    Paid = 2,

    /// <summary>
    /// The bill has passed its due date without payment.
    /// </summary>
    Overdue = 3,

    /// <summary>
    /// The bill has been cancelled and no longer requires payment.
    /// </summary>
    Cancelled = 4,

    /// <summary>
    /// The bill is approaching its due date.
    /// </summary>
    Upcoming = 5
}
