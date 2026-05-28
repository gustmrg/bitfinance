using BitFinance.API.Settings;

namespace BitFinance.API.Services.Interfaces;

public interface IFileValidationService
{
    FileValidationResult ValidateFile(Stream fileStream, string fileName, long fileSize, string contentType, FileUploadRules rules);
}

public class FileValidationResult
{
    public bool IsValid { get; set; }
    public List<string> Errors { get; set; } = [];
    public string ErrorMessage => string.Join("; ", Errors);
}