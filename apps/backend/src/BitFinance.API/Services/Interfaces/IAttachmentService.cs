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

    Task<(Stream stream, string fileName, string contentType)> GetAttachmentAsync(Guid attachmentId);

    Task<bool> DeleteAttachmentAsync(Guid attachmentId);
}
