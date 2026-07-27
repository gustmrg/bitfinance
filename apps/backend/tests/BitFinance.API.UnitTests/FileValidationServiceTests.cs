using BitFinance.API.Services;
using BitFinance.API.Settings;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class FileValidationServiceTests
{
    private readonly FileValidationService _service =
        new(Mock.Of<ILogger<FileValidationService>>());

    [Fact]
    public void ValidateFile_ValidPngAttachment_Succeeds()
    {
        using var stream = new MemoryStream(
            [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

        var result = _service.ValidateFile(
            stream,
            "receipt.png",
            stream.Length,
            "image/png",
            FileUploadRules.Documents());

        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidateFile_SpoofedPngAttachment_IsRejected()
    {
        using var stream = new MemoryStream(new byte[8]);

        var result = _service.ValidateFile(
            stream,
            "receipt.png",
            stream.Length,
            "image/png",
            FileUploadRules.Documents());

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("does not match", StringComparison.Ordinal));
    }

    [Fact]
    public void ValidateFile_UnsupportedContentType_IsRejected()
    {
        using var stream = new MemoryStream(
            [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

        var result = _service.ValidateFile(
            stream,
            "receipt.png",
            stream.Length,
            "application/octet-stream",
            FileUploadRules.Documents());

        Assert.False(result.IsValid);
        Assert.Contains(result.Errors, error => error.Contains("Content type", StringComparison.Ordinal));
    }
}
