using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace BitFinance.Data.Configurations;

public class AttachmentConfiguration : IEntityTypeConfiguration<Attachment>
{
    public void Configure(EntityTypeBuilder<Attachment> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Id)
            .HasColumnName("id");

        builder.Property(a => a.AttachmentType)
            .HasColumnName("attachment_type")
            .IsRequired();

        builder.Property(a => a.FileName)
            .HasColumnName("file_name")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(a => a.OriginalFileName)
            .HasColumnName("original_file_name")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(a => a.ContentType)
            .HasColumnName("content_type")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(a => a.FileSizeInBytes)
            .HasColumnName("file_size_in_bytes")
            .IsRequired();

        builder.Property(a => a.StoragePath)
            .HasColumnName("storage_path")
            .HasColumnType("text")
            .IsRequired();

        builder.Property(a => a.FileCategory)
            .HasColumnName("file_category")
            .IsRequired();

        builder.Property(a => a.Description)
            .HasColumnName("description")
            .HasColumnType("text");

        builder.Property(a => a.FileHash)
            .HasColumnName("file_hash")
            .HasColumnType("text");

        builder.Property(a => a.UploadedAt)
            .HasColumnName("uploaded_at")
            .HasColumnType("timestamptz")
            .IsRequired();

        builder.Property(a => a.UploadedByUserId)
            .HasColumnName("uploaded_by_user_id")
            .HasColumnType("text");

        builder.HasOne(a => a.Bill)
            .WithMany(b => b.Attachments)
            .HasForeignKey(a => a.BillId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Expense)
            .WithMany(e => e.Attachments)
            .HasForeignKey(a => a.ExpenseId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.User)
            .WithOne(u => u.Avatar)
            .HasForeignKey<Attachment>(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(a => a.Organization)
            .WithMany()
            .HasForeignKey(a => a.OrganizationId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(a => a.BillId)
            .HasDatabaseName("ix_attachments_bill_id");

        builder.HasIndex(a => a.ExpenseId)
            .HasDatabaseName("ix_attachments_expense_id");

        builder.HasIndex(a => a.UserId)
            .HasDatabaseName("ix_attachments_user_id");

        builder.HasIndex(a => a.OrganizationId)
            .HasDatabaseName("ix_attachments_organization_id");

        builder.ToTable("attachments", t =>
        {
            t.HasCheckConstraint("ck_attachments_single_owner",
                @"(CASE WHEN bill_id IS NOT NULL THEN 1 ELSE 0 END +
                  CASE WHEN expense_id IS NOT NULL THEN 1 ELSE 0 END +
                  CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) = 1");
        });
    }
}
