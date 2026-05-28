using BitFinance.Business.Enums;

namespace BitFinance.Business.Entities;

public class Attachment
{
    public Guid Id { get; set; }

    public Guid? BillId { get; set; }
    public Bill? Bill { get; set; }

    public Guid? ExpenseId { get; set; }
    public Expense? Expense { get; set; }

    public string? UserId { get; set; }
    public User? User { get; set; }

    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public AttachmentType AttachmentType { get; set; }

    public string FileName { get; set; } = null!;
    public string OriginalFileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;
    public long FileSizeInBytes { get; set; }
    public string StoragePath { get; set; } = null!;

    public FileCategory FileCategory { get; set; }

    public string? Description { get; set; }
    public string? FileHash { get; set; }

    public DateTime UploadedAt { get; set; }
    public string? UploadedByUserId { get; set; }
}
