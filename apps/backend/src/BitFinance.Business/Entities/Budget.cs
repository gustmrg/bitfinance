namespace BitFinance.Business.Entities;

/// <summary>
/// Represents the monthly budget configured for an organization.
/// </summary>
public class Budget
{
    /// <summary>
    /// Unique identifier for the budget.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// The organization this budget belongs to.
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// The configured monthly budget amount.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// The date and time when this budget was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The date and time when this budget was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Navigation property to the owning organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;
}
