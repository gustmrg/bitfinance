using BitFinance.Business.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class BillConfiguration : IEntityTypeConfiguration<Bill>
{
    public void Configure(EntityTypeBuilder<Bill> builder)
    {
        builder.HasKey(b => b.Id);

        builder.Property(b => b.Id)
            .HasColumnName("id");
        
        builder.Property(b => b.Description)
            .HasColumnName("description")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(b => b.Notes)
            .HasColumnName("notes")
            .HasMaxLength(2000);
        
        builder.Property(b => b.Category)
            .HasColumnName("category")
            .HasColumnType("text")
            .IsRequired();
        
        builder.Property(b => b.Status)
            .HasColumnName("status")
            .HasColumnType("text")  
            .IsRequired();
        
        builder.Property(b => b.DueDate)
            .HasColumnName("due_date")
            .HasColumnType("date")
            .IsRequired();
        
        builder.Property(b => b.PaymentDate)
            .HasColumnName("payment_date")
            .HasColumnType("timestamp with time zone")
            .HasPrecision(3);
        
        builder.Property(b => b.AmountDue)
            .HasColumnName("amount_due")
            .HasColumnType("numeric(10,2)")
            .IsRequired();
        
        builder.Property(b => b.AmountPaid)
            .HasColumnName("amount_paid")
            .HasColumnType("numeric(10,2)");
        
        builder.Property(b => b.CreatedAt)
            .HasColumnName("created_at")
            .HasColumnType("timestamp with time zone")
            .HasPrecision(3)
            .IsRequired();
        
        builder.Property(b => b.UpdatedAt)
            .HasColumnName("updated_at")
            .HasColumnType("timestamp with time zone")
            .HasPrecision(3);

        builder.Property(b => b.BillSeriesId)
            .HasColumnName("bill_series_id")
            .HasColumnType("uuid");

        builder.Property(b => b.OccurrenceNumber)
            .HasColumnName("occurrence_number")
            .HasColumnType("integer");

        builder.Property(b => b.TotalOccurrences)
            .HasColumnName("total_occurrences")
            .HasColumnType("integer");

        builder.HasOne(b => b.BillSeries)
            .WithMany(s => s.Bills)
            .HasForeignKey(b => b.BillSeriesId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(b => b.BillSeriesId)
            .HasDatabaseName("ix_bills_bill_series_id");

        builder.ToTable("bills");
    }
}
