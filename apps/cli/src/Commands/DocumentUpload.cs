using BitFinance.Cli.Errors;
using System.Net.Http.Headers;

namespace BitFinance.Cli.Commands;

internal sealed record DocumentUpload(FileInfo File, string ContentType)
{
    private const long MaximumFileSize = 10 * 1024 * 1024;

    private static readonly IReadOnlyDictionary<string, string> ContentTypes =
        new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            [".pdf"] = "application/pdf",
            [".jpg"] = "image/jpeg",
            [".jpeg"] = "image/jpeg",
            [".png"] = "image/png",
            [".doc"] = "application/msword",
            [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        };

    public static DocumentUpload Validate(FileInfo file, string? requestedContentType)
    {
        ArgumentNullException.ThrowIfNull(file);
        file.Refresh();

        if (!file.Exists)
        {
            throw CliException.InvalidArguments($"Document file does not exist: {file.FullName}");
        }

        if (!ContentTypes.TryGetValue(file.Extension, out var inferredContentType))
        {
            throw CliException.InvalidArguments(
                "Document extension must be one of: .pdf, .jpg, .jpeg, .png, .doc, .docx.");
        }

        if (file.Length > MaximumFileSize)
        {
            throw CliException.InvalidArguments("Document file must be 10 MB or smaller.");
        }

        var contentType = string.IsNullOrWhiteSpace(requestedContentType)
            ? inferredContentType
            : requestedContentType.Trim();
        if (!MediaTypeHeaderValue.TryParse(contentType, out _))
        {
            throw CliException.InvalidArguments("--content-type must be a valid media type.");
        }

        return new DocumentUpload(file, contentType);
    }
}
