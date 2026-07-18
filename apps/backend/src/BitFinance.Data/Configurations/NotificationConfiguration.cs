using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.HasKey(notification => notification.Id);
        builder.Property(notification => notification.Type).HasConversion<string>().HasMaxLength(64).IsRequired();
        builder.Property(notification => notification.RecipientUserId).IsRequired();
        builder.Property(notification => notification.PayloadJson).HasColumnType("jsonb").IsRequired();
        builder.Property(notification => notification.ActionPath).HasMaxLength(500).IsRequired();
        builder.Property(notification => notification.CreatedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(notification => notification.ReadAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.HasIndex(notification => new { notification.SourceEventId, notification.RecipientUserId }).IsUnique();
        builder.HasIndex(notification => new { notification.OrganizationId, notification.RecipientUserId, notification.ReadAt, notification.CreatedAt });
        builder.HasOne(notification => notification.Organization)
            .WithMany()
            .HasForeignKey(notification => notification.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(notification => notification.RecipientUser)
            .WithMany()
            .HasForeignKey(notification => notification.RecipientUserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.ToTable("notifications");
    }
}
