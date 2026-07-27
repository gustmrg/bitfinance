using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.API.Services.Interfaces;

public interface IAttachmentService
{
    Task<Attachment> UploadBillAttachmentAsync(
        Guid organizationId, Guid billId, Stream fileStream, string fileName,
        string contentType, FileCategory fileCategory, string? userId = null);

    Task<Attachment> UploadExpenseAttachmentAsync(
        Guid organizationId, Guid expenseId, Stream fileStream, string fileName,
        string contentType, FileCategory fileCategory, string? userId = null);

    Task<Attachment> UploadUserAvatarAsync(string userId, Stream fileStream, string fileName, string contentType);

    Task<(Stream stream, string fileName, string contentType)> GetUserAvatarAsync(string userId);

    Task<(Stream stream, string fileName, string contentType)> GetDocumentAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType);

    Task<AttachmentDownloadUrlResult> GetDocumentDownloadUrlAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType);

    Task<bool> DeleteDocumentAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType);

    Task<bool> DeleteUserAvatarAsync(string userId);

    Task<bool> DeleteAttachmentAsync(Guid attachmentId);
}

public record AttachmentDownloadUrlResult(
    string Url,
    string FileName,
    string ContentType,
    DateTimeOffset ExpiresAt);
