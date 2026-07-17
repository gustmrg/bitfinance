namespace BitFinance.Business.Enums;

public enum NotificationDeliveryStatus
{
    Pending = 1,
    Processing = 2,
    Sent = 3,
    Delivered = 4,
    Bounced = 5,
    Failed = 6,
    Suppressed = 7,
}
