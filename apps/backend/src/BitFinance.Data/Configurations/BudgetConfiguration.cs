using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class BudgetConfiguration : IEntityTypeConfiguration<Budget>
{
    public void Configure(EntityTypeBuilder<Budget> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasColumnName("id");

        builder.Property(b => b.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();

        builder.Property(b => b.Amount)
            .HasColumnName("amount")
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        builder.Property(b => b.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestampz")
            .HasPrecision(3)
            .IsRequired();

        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("timestampz")
            .HasPrecision(3);

        builder.HasIndex(b => b.OrganizationId)
            .IsUnique();

        builder.HasOne(b => b.Organization)
            .WithOne(o => o.Budget)
            .HasForeignKey<Budget>(b => b.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.ToTable("budgets", table =>
        {
            table.HasCheckConstraint("ck_budgets_amount_non_negative", "amount >= 0");
        });
    }
}
