using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class BillSeriesConfiguration : IEntityTypeConfiguration<BillSeries>
{
    public void Configure(EntityTypeBuilder<BillSeries> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasColumnName("id");

        builder.Property(b => b.Description)
            .HasColumnName("description")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(b => b.Category)
            .HasColumnName("category")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(b => b.Frequency)
            .HasColumnName("frequency")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(b => b.AmountDue)
            .HasColumnName("amount_due")
            .HasColumnType("numeric(10,2)")
            .IsRequired();

        builder.Property(b => b.StartDate)
            .HasColumnName("start_date")
            .HasColumnType("date")
            .IsRequired();

        builder.Property(b => b.TotalOccurrences)
            .HasColumnName("total_occurrences")
            .HasColumnType("integer");

        builder.Property(b => b.IsActive)
            .HasColumnName("is_active")
            .IsRequired();

        builder.Property(b => b.NextOccurrenceNumber)
            .HasColumnName("next_occurrence_number")
            .HasColumnType("integer")
            .IsRequired();

        builder.Property(b => b.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp with time zone")
            .HasPrecision(3)
            .IsRequired();

        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("timestamp with time zone")
            .HasPrecision(3);

        builder.Property(b => b.StoppedAt)
            .HasColumnName("stopped_at")
            .HasColumnType("timestamp with time zone")
            .HasPrecision(3);

        builder.Property(b => b.OrganizationId)
            .HasColumnName("organization_id")
            .IsRequired();

        builder.Ignore(b => b.Type);

        builder.HasOne(b => b.Organization)
            .WithMany()
            .HasForeignKey(b => b.OrganizationId)
            .OnDelete(DeleteBehavior.Cascade)
            .IsRequired();

        builder.HasIndex(b => b.OrganizationId)
            .HasDatabaseName("ix_bill_series_organization_id");

        builder.ToTable("bill_series", t =>
        {
            t.HasCheckConstraint("ck_bill_series_amount_non_negative", "amount_due >= 0");
            t.HasCheckConstraint("ck_bill_series_next_occurrence_positive", "next_occurrence_number > 0");
        });
    }
}
