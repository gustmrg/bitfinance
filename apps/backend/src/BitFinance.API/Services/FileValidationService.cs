using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;

namespace BitFinance.API.Services;

public class FileValidationService : IFileValidationService
{
    private readonly ILogger<FileValidationService> _logger;

    public FileValidationService(ILogger<FileValidationService> logger)
    {
        _logger = logger;
    }

    public FileValidationResult ValidateFile(Stream fileStream, string fileName, long fileSize, string contentType, FileUploadRules rules)
    {
        var errors = new List<string>();

        if (fileSize > rules.MaxFileSizeInBytes)
        {
            var maxSizeMB = rules.MaxFileSizeInBytes / 1024 / 1024;
            errors.Add($"File size ({fileSize / 1024 / 1024}MB) exceeds maximum allowed size ({maxSizeMB}MB)");
        }

        var extension = Path.GetExtension(fileName)?.ToLowerInvariant();
        if (string.IsNullOrEmpty(extension) || !rules.AllowedExtensions.Contains(extension))
        {
            errors.Add($"File extension '{extension}' is not allowed. Allowed: {string.Join(", ", rules.AllowedExtensions)}");
        }

        if (!rules.AllowedContentTypes.Contains(contentType.ToLowerInvariant()))
        {
            errors.Add($"Content type '{contentType}' is not allowed");
        }

        if (!string.IsNullOrEmpty(extension) && rules.FileSignatures.TryGetValue(extension, out var expectedSignature))
        {
            if (!VerifyFileSignature(fileStream, expectedSignature))
            {
                errors.Add($"File content does not match the expected format for {extension} files");
            }
        }

        if (ContainsInvalidFileNameCharacters(fileName))
        {
            errors.Add("File name contains invalid characters");
        }

        return new FileValidationResult
        {
            IsValid = errors.Count == 0,
            Errors = errors
        };
    }

    private static bool VerifyFileSignature(Stream stream, byte[] expectedSignature)
    {
        if (stream.Length < expectedSignature.Length)
            return false;

        var buffer = new byte[expectedSignature.Length];
        var originalPosition = stream.Position;

        try
        {
            stream.Position = 0;
            stream.ReadExactly(buffer, 0, expectedSignature.Length);

            for (int i = 0; i < expectedSignature.Length; i++)
            {
                if (buffer[i] != expectedSignature[i])
                    return false;
            }

            return true;
        }
        finally
        {
            stream.Position = originalPosition;
        }
    }

    private static bool ContainsInvalidFileNameCharacters(string fileName)
    {
        var invalidChars = Path.GetInvalidFileNameChars();
        var additionalInvalidPatterns = new[] { "..", "~", "`" };

        return fileName.IndexOfAny(invalidChars) >= 0 ||
               additionalInvalidPatterns.Any(pattern => fileName.Contains(pattern));
    }
}