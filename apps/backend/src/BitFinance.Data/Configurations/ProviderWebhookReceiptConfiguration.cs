using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class ProviderWebhookReceiptConfiguration : IEntityTypeConfiguration<ProviderWebhookReceipt>
{
    public void Configure(EntityTypeBuilder<ProviderWebhookReceipt> builder)
    {
        builder.HasKey(receipt => receipt.ProviderEventId);
        builder.Property(receipt => receipt.ProviderEventId).HasMaxLength(256);
        builder.Property(receipt => receipt.ReceivedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.ToTable("provider_webhook_receipts");
    }
}
