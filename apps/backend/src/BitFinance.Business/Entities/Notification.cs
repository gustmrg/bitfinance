using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

public class Notification
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid SourceEventId { get; set; }
    public Guid OrganizationId { get; set; }
    public required string RecipientUserId { get; set; }
    public NotificationType Type { get; set; }
    public required string PayloadJson { get; set; }
    public required string ActionPath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReadAt { get; set; }

    public Organization Organization { get; set; } = null!;
    public User RecipientUser { get; set; } = null!;
    public ICollection<NotificationDelivery> Deliveries { get; set; } = new List<NotificationDelivery>();
}
