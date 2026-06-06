namespace BitFinance.API.Models.Response;

public record DownloadDocumentUrlResponse(
    string Url,
    string FileName,
    string ContentType,
    DateTimeOffset ExpiresAt);
