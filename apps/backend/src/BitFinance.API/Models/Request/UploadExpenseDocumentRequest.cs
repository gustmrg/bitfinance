using System.ComponentModel.DataAnnotations;
using BitFinance.API.Attributes;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Request;

public class UploadExpenseDocumentRequest
{
    [Required]
    [AllowedFileExtensions(".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx")]
    [MaxFileSize(10 * 1024 * 1024)]
    public IFormFile File { get; set; } = null!;

    [Required]
    [EnumDataType(typeof(FileCategory))]
    public FileCategory FileCategory { get; set; }
}
