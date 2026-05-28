using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class InvitationConfiguration : IEntityTypeConfiguration<Invitation>
{
    public void Configure(EntityTypeBuilder<Invitation> builder)
    {
        builder.HasKey(i => i.Id);

        builder.Property(i => i.Email)
            .HasMaxLength(256)
            .IsRequired();

        builder.Property(i => i.Role)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(i => i.Status)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(i => i.TokenHash)
            .HasMaxLength(256)
            .IsRequired();

        builder.HasIndex(i => i.TokenHash).IsUnique();

        builder.Property(i => i.ExpiresAt)
            .HasColumnType("timestampz")
            .HasPrecision(3)
            .IsRequired();

        builder.Property(i => i.CreatedAt)
            .HasColumnType("timestampz")
            .HasPrecision(3)
            .IsRequired();

        builder.HasOne(i => i.Organization)
            .WithMany(o => o.Invitations)
            .HasForeignKey(i => i.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.InvitedBy)
            .WithMany()
            .HasForeignKey(i => i.InvitedByUserId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.ToTable("invitations");
    }
}
