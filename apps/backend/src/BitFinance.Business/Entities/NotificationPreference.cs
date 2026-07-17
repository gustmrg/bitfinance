namespace BitFinance.Business.Entities;

public class NotificationPreference
{
    public required string UserId { get; set; }
    public Guid OrganizationId { get; set; }
    public bool EmailBillRemindersEnabled { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public User User { get; set; } = null!;
    public Organization Organization { get; set; } = null!;
}
