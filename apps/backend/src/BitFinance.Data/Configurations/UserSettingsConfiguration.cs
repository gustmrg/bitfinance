using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class UserSettingsConfiguration : IEntityTypeConfiguration<UserSettings>
{
    public void Configure(EntityTypeBuilder<UserSettings> builder)
    {
        builder.HasKey(u => u.UserId);
        
        builder.Property(u => u.PreferredLanguage)
            .HasMaxLength(5)
            .HasColumnName("preferred_language");
        
        builder.Property(u => u.TimeZoneId)
            .HasMaxLength(150)
            .HasColumnName("timezone_id");
        
        builder.ToTable("user_settings");
    }
}