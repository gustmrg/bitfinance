namespace BitFinance.API.Settings;

public class FileUploadRules
{
    public long MaxFileSizeInBytes { get; init; }
    public HashSet<string> AllowedExtensions { get; init; } = [];
    public HashSet<string> AllowedContentTypes { get; init; } = [];
    public Dictionary<string, byte[]> FileSignatures { get; init; } = new();

    public static FileUploadRules Documents() => new()
    {
        MaxFileSizeInBytes = 10 * 1024 * 1024,
        AllowedExtensions = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"],
        AllowedContentTypes =
        [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ],
        FileSignatures = new Dictionary<string, byte[]>
        {
            { ".pdf", [0x25, 0x50, 0x44, 0x46] },
            { ".jpg", [0xFF, 0xD8, 0xFF] },
            { ".jpeg", [0xFF, 0xD8, 0xFF] },
            { ".png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
        }
    };

    public static FileUploadRules Avatars() => new()
    {
        MaxFileSizeInBytes = 2 * 1024 * 1024,
        AllowedExtensions = [".jpg", ".jpeg", ".png"],
        AllowedContentTypes =
        [
            "image/jpeg",
            "image/jpg",
            "image/png"
        ],
        FileSignatures = new Dictionary<string, byte[]>
        {
            { ".jpg", [0xFF, 0xD8, 0xFF] },
            { ".jpeg", [0xFF, 0xD8, 0xFF] },
            { ".png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
        }
    };

    public static FileUploadRules Images() => new()
    {
        MaxFileSizeInBytes = 5 * 1024 * 1024,
        AllowedExtensions = [".jpg", ".jpeg", ".png"],
        AllowedContentTypes =
        [
            "image/jpeg",
            "image/jpg",
            "image/png"
        ],
        FileSignatures = new Dictionary<string, byte[]>
        {
            { ".jpg", [0xFF, 0xD8, 0xFF] },
            { ".jpeg", [0xFF, 0xD8, 0xFF] },
            { ".png", [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] }
        }
    };
}