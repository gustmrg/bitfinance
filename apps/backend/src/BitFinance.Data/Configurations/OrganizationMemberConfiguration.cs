using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class OrganizationMemberConfiguration : IEntityTypeConfiguration<OrganizationMember>
{
    public void Configure(EntityTypeBuilder<OrganizationMember> builder)
    {
        builder.HasKey(om => new { om.UserId, om.OrganizationId });

        builder.Property(om => om.Role)
            .HasConversion<int>()
            .IsRequired();

        builder.Property(om => om.JoinedAt)
            .HasColumnType("timestampz")
            .HasPrecision(3)
            .IsRequired();

        builder.HasOne(om => om.User)
            .WithMany(u => u.OrganizationMemberships)
            .HasForeignKey(om => om.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(om => om.Organization)
            .WithMany(o => o.Members)
            .HasForeignKey(om => om.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.ToTable("organization_members");
    }
}
