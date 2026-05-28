using System.ComponentModel.DataAnnotations;
using BitFinance.API.Attributes;

namespace BitFinance.API.Models.Request;

public class UploadAvatarRequest
{
    [Required]
    [AllowedFileExtensions(".jpg", ".jpeg", ".png")]
    [MaxFileSize(2 * 1024 * 1024)]
    public IFormFile File { get; set; } = null!;
}
