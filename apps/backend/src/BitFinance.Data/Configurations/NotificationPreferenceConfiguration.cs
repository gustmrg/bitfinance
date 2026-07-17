using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class NotificationPreferenceConfiguration : IEntityTypeConfiguration<NotificationPreference>
{
    public void Configure(EntityTypeBuilder<NotificationPreference> builder)
    {
        builder.HasKey(preference => new { preference.UserId, preference.OrganizationId });
        builder.Property(preference => preference.EmailBillRemindersEnabled).HasDefaultValue(true);
        builder.Property(preference => preference.CreatedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(preference => preference.UpdatedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.HasOne(preference => preference.User)
            .WithMany()
            .HasForeignKey(preference => preference.UserId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(preference => preference.Organization)
            .WithMany()
            .HasForeignKey(preference => preference.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.ToTable("notification_preferences");
    }
}
