using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// Represents an expense recorded by an organization member.
/// </summary>
public class Expense
{
    /// <summary>
    /// Unique identifier for the expense.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// A brief description of what the expense was for.
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// The category that classifies this expense.
    /// </summary>
    public ExpenseCategory Category { get; set; }

    /// <summary>
    /// The monetary amount of the expense.
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// The current approval or processing status of the expense.
    /// </summary>
    public ExpenseStatus Status { get; set; }

    /// <summary>
    /// The date and time when the expense occurred.
    /// </summary>
    public DateTime OccurredAt { get; set; }

    /// <summary>
    /// The date and time when this expense record was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The date and time when this expense was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// The ID of the organization this expense belongs to.
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// Navigation property to the owning organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The ID of the user who created this expense.
    /// </summary>
    public string CreatedByUserId { get; set; } = null!;

    /// <summary>
    /// Navigation property to the user who created this expense.
    /// </summary>
    public User CreatedByUser { get; set; } = null!;

    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
