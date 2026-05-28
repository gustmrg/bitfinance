using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// Represents a bill or invoice that an organization needs to pay.
/// </summary>
public class Bill
{
    /// <summary>
    /// Unique identifier for the bill.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// A brief description of what the bill is for.
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// The category that classifies this bill (e.g., utilities, rent, subscriptions).
    /// </summary>
    public BillCategory Category { get; set; }

    /// <summary>
    /// The current payment status of the bill.
    /// </summary>
    public BillStatus Status { get; set; }

    /// <summary>
    /// The total amount due for this bill.
    /// </summary>
    public decimal AmountDue { get; set; }

    /// <summary>
    /// The amount that has been paid, if any.
    /// </summary>
    public decimal? AmountPaid { get; set; }

    /// <summary>
    /// The date by which the bill must be paid.
    /// </summary>
    public DateOnly DueDate { get; set; }

    /// <summary>
    /// The date and time when the bill was paid, if applicable.
    /// </summary>
    public DateTimeOffset? PaymentDate { get; set; }

    /// <summary>
    /// The date and time when this bill was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The date and time when this bill was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// The ID of the organization this bill belongs to.
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// Navigation property to the owning organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The documents attached to this bill (e.g., receipts, invoices).
    /// </summary>
    public ICollection<Attachment> Attachments { get; set; } = new List<Attachment>();
}
