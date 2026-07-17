using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class NotificationDeliveryConfiguration : IEntityTypeConfiguration<NotificationDelivery>
{
    public void Configure(EntityTypeBuilder<NotificationDelivery> builder)
    {
        builder.HasKey(delivery => delivery.Id);
        builder.Property(delivery => delivery.Channel).HasMaxLength(32).IsRequired();
        builder.Property(delivery => delivery.Status).HasConversion<string>().HasMaxLength(32).IsRequired();
        builder.Property(delivery => delivery.NextAttemptAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(delivery => delivery.LockedUntil).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(delivery => delivery.ProviderMessageId).HasMaxLength(256);
        builder.Property(delivery => delivery.ProviderEventAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(delivery => delivery.SentAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(delivery => delivery.LastError).HasMaxLength(2000);
        builder.HasIndex(delivery => new { delivery.NotificationId, delivery.Channel }).IsUnique();
        builder.HasIndex(delivery => delivery.ProviderMessageId);
        builder.HasIndex(delivery => new { delivery.Status, delivery.NextAttemptAt, delivery.LockedUntil });
        builder.HasOne(delivery => delivery.Notification)
            .WithMany(notification => notification.Deliveries)
            .HasForeignKey(delivery => delivery.NotificationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.ToTable("notification_deliveries");
    }
}
