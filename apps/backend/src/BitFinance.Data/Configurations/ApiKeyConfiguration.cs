using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class ApiKeyConfiguration : IEntityTypeConfiguration<ApiKey>
{
    public void Configure(EntityTypeBuilder<ApiKey> builder)
    {
        builder.ToTable("api_keys");

        builder.HasKey(key => key.Id);

        builder.Property(key => key.Name).IsRequired().HasMaxLength(100);
        builder.Property(key => key.Prefix).IsRequired().HasMaxLength(16);
        builder.Property(key => key.KeyHash).IsRequired().HasMaxLength(64);

        builder.Property(key => key.CreatedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(key => key.ExpiresAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(key => key.LastUsedAt).HasColumnType("timestamp with time zone").HasPrecision(3);
        builder.Property(key => key.RevokedAt).HasColumnType("timestamp with time zone").HasPrecision(3);

        builder.HasOne(key => key.User)
            .WithMany()
            .HasForeignKey(key => key.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(key => key.Organizations)
            .WithOne()
            .HasForeignKey(scope => scope.ApiKeyId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(key => key.KeyHash).IsUnique();
        builder.HasIndex(key => key.UserId);
    }
}

public class ApiKeyOrganizationConfiguration : IEntityTypeConfiguration<ApiKeyOrganization>
{
    public void Configure(EntityTypeBuilder<ApiKeyOrganization> builder)
    {
        builder.ToTable("api_key_organizations");

        builder.HasKey(scope => new { scope.ApiKeyId, scope.OrganizationId });

        builder.Property(scope => scope.Access)
            .HasConversion<string>()
            .HasMaxLength(16)
            .IsRequired();

        builder.HasOne(scope => scope.Organization)
            .WithMany()
            .HasForeignKey(scope => scope.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
