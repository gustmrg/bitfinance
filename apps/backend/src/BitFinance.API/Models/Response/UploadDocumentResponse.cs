using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public record UploadDocumentResponse
{
    public Guid Id { get; set; }
    public string FileName { get; set; } = null!;
    public string ContentType { get; set; } = null!;

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public FileCategory FileCategory { get; set; }

    [JsonConverter(typeof(JsonStringEnumConverter))]
    public AttachmentType AttachmentType { get; set; }
}