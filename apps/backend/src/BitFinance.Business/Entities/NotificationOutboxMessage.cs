using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

public class NotificationOutboxMessage
{
    public Guid Id { get; set; } = Guid.CreateVersion7();
    public Guid OrganizationId { get; set; }
    public NotificationType Type { get; set; }
    public string? AggregateId { get; set; }
    public required string DeduplicationKey { get; set; }
    public required string PayloadJson { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ProcessedAt { get; set; }
    public int Attempts { get; set; }
    public DateTime NextAttemptAt { get; set; } = DateTime.UtcNow;
    public DateTime? LockedUntil { get; set; }
    public string? LastError { get; set; }
}
