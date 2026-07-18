using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

public class NotificationDelivery
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid NotificationId { get; set; }
    public string Channel { get; set; } = "email";
    public NotificationDeliveryStatus Status { get; set; } = NotificationDeliveryStatus.Pending;
    public int Attempts { get; set; }
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? LockedUntil { get; set; }
    public string? ProviderMessageId { get; set; }
    public DateTime? ProviderEventAt { get; set; }
    public DateTime? SentAt { get; set; }
    public string? LastError { get; set; }

    public Notification Notification { get; set; } = null!;
}
