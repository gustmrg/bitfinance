using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class NotificationOutboxMessageConfiguration : IEntityTypeConfiguration<NotificationOutboxMessage>
{
    public void Configure(EntityTypeBuilder<NotificationOutboxMessage> builder)
    {
        builder.HasKey(message => message.Id);
        builder.Property(message => message.Type).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(message => message.AggregateId).HasMaxLength(128);
        builder.Property(message => message.DeduplicationKey).HasMaxLength(256).IsRequired();
        builder.Property(message => message.PayloadJson).HasColumnType("jsonb").IsRequired();
        builder.Property(message => message.CreatedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(message => message.ProcessedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(message => message.NextAttemptAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(message => message.LockedUntil).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(message => message.LastError).HasMaxLength(2000);
        builder.HasIndex(message => message.DeduplicationKey).IsUnique();
        builder.HasIndex(message => new { message.ProcessedAt, message.NextAttemptAt, message.LockedUntil });
        builder.ToTable("notification_outbox_messages");
    }
}
