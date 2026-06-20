using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

/// <summary>
/// Defines the schedule/template that generates recurring or installment <see cref="Bill"/> occurrences.
/// One-time bills are not linked to a series.
/// </summary>
public class BillSeries
{
    /// <summary>
    /// Unique identifier for the bill series.
    /// </summary>
    public Guid Id { get; set; }

    /// <summary>
    /// A brief description shared by every generated occurrence.
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// The category applied to every generated occurrence.
    /// </summary>
    public BillCategory Category { get; set; }

    /// <summary>
    /// The recurrence frequency used to compute occurrence due dates.
    /// </summary>
    public Frequency Frequency { get; set; }

    /// <summary>
    /// The amount due for each occurrence. For installments this is the amount per installment.
    /// </summary>
    public decimal AmountDue { get; set; }

    /// <summary>
    /// The due date of the first occurrence.
    /// </summary>
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// The total number of occurrences to generate for installment series.
    /// <c>null</c> indicates an indefinite recurring series.
    /// </summary>
    public int? TotalOccurrences { get; set; }

    /// <summary>
    /// The type of series, derived from <see cref="TotalOccurrences"/>.
    /// </summary>
    public BillSeriesType Type => TotalOccurrences is null ? BillSeriesType.Recurring : BillSeriesType.Installment;

    /// <summary>
    /// Whether the series is still generating new occurrences.
    /// Set to <c>false</c> when future generation is stopped.
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// The next occurrence number to generate. Starts at 1.
    /// </summary>
    public int NextOccurrenceNumber { get; set; } = 1;

    /// <summary>
    /// The date and time when this series was created.
    /// </summary>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// The date and time when this series was last updated.
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// The date and time when future generation was stopped, if applicable.
    /// </summary>
    public DateTime? StoppedAt { get; set; }

    /// <summary>
    /// The ID of the organization this series belongs to.
    /// </summary>
    public Guid OrganizationId { get; set; }

    /// <summary>
    /// Navigation property to the owning organization.
    /// </summary>
    public Organization Organization { get; set; } = null!;

    /// <summary>
    /// The bill occurrences generated from this series.
    /// </summary>
    public ICollection<Bill> Bills { get; set; } = new List<Bill>();
}
