namespace BitFinance.Business.Entities;

public class ProviderWebhookReceipt
{
    public required string ProviderEventId { get; set; }
    public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
}
