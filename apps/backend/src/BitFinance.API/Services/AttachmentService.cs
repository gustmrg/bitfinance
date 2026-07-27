using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class AttachmentService : IAttachmentService
{
    private static readonly TimeSpan DocumentDownloadUrlExpiration = TimeSpan.FromMinutes(15);

    private readonly IFileStorageService _storageService;
    private readonly IFileValidationService _fileValidationService;
    private readonly IAttachmentsRepository _attachmentsRepository;
    private readonly ILogger<AttachmentService> _logger;
    private readonly IBillsRepository _billsRepository;
    private readonly IExpensesRepository _expensesRepository;
    private readonly IOrganizationsRepository _organizationsRepository;

    public AttachmentService(
        IFileStorageService storageService,
        IFileValidationService fileValidationService,
        IAttachmentsRepository attachmentsRepository,
        ILogger<AttachmentService> logger,
        IBillsRepository billsRepository,
        IExpensesRepository expensesRepository,
        IOrganizationsRepository organizationsRepository)
    {
        _storageService = storageService;
        _fileValidationService = fileValidationService;
        _attachmentsRepository = attachmentsRepository;
        _logger = logger;
        _billsRepository = billsRepository;
        _expensesRepository = expensesRepository;
        _organizationsRepository = organizationsRepository;
    }

    public async Task<Attachment> UploadBillAttachmentAsync(
        Guid organizationId, Guid billId, Stream fileStream, string fileName,
        string contentType, FileCategory fileCategory, string? userId = null)
    {
        ValidateFile(fileStream, fileName, contentType, FileUploadRules.Documents());

        var bill = await _billsRepository.GetByIdAsync(billId)
            ?? throw new KeyNotFoundException($"Bill with ID {billId} not found.");
        if (bill.OrganizationId != organizationId)
            throw new KeyNotFoundException($"Bill with ID {billId} not found.");

        await ValidateStorageEntitlement(organizationId, fileStream.Length);

        var directoryPath = StoragePathBuilder.ForBill(organizationId, billId);
        var storageResult = await SaveFileToStorage(fileStream, fileName, contentType, directoryPath);

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            BillId = billId,
            OrganizationId = organizationId,
            AttachmentType = AttachmentType.BillDocument,
            FileName = storageResult.FileName!,
            OriginalFileName = fileName,
            ContentType = contentType,
            FileSizeInBytes = storageResult.FileSizeInBytes ?? 0,
            StoragePath = storageResult.StoragePath!,
            FileCategory = fileCategory,
            FileHash = storageResult.FileHash,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = userId
        };

        await _attachmentsRepository.CreateAsync(attachment);
        return attachment;
    }

    public async Task<Attachment> UploadExpenseAttachmentAsync(
        Guid organizationId, Guid expenseId, Stream fileStream, string fileName,
        string contentType, FileCategory fileCategory, string? userId = null)
    {
        ValidateFile(fileStream, fileName, contentType, FileUploadRules.Documents());

        var expense = await _expensesRepository.GetByIdAsync(expenseId)
            ?? throw new KeyNotFoundException($"Expense with ID {expenseId} not found.");
        if (expense.OrganizationId != organizationId)
            throw new KeyNotFoundException($"Expense with ID {expenseId} not found.");

        await ValidateStorageEntitlement(organizationId, fileStream.Length);

        var directoryPath = StoragePathBuilder.ForExpense(organizationId, expenseId);
        var storageResult = await SaveFileToStorage(fileStream, fileName, contentType, directoryPath);

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            ExpenseId = expenseId,
            OrganizationId = organizationId,
            AttachmentType = AttachmentType.ExpenseDocument,
            FileName = storageResult.FileName!,
            OriginalFileName = fileName,
            ContentType = contentType,
            FileSizeInBytes = storageResult.FileSizeInBytes ?? 0,
            StoragePath = storageResult.StoragePath!,
            FileCategory = fileCategory,
            FileHash = storageResult.FileHash,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = userId
        };

        await _attachmentsRepository.CreateAsync(attachment);
        return attachment;
    }

    public async Task<Attachment> UploadUserAvatarAsync(
        string userId, Stream fileStream, string fileName, string contentType)
    {
        ValidateFile(fileStream, fileName, contentType, FileUploadRules.Avatars());

        var existingAvatar = await _attachmentsRepository.GetUserAvatarAsync(userId);
        var directoryPath = StoragePathBuilder.ForUserAvatar(userId);
        var storageResult = await SaveFileToStorage(fileStream, fileName, contentType, directoryPath);

        if (existingAvatar is not null)
        {
            var previousStoragePath = existingAvatar.StoragePath;
            existingAvatar.FileName = storageResult.FileName!;
            existingAvatar.OriginalFileName = fileName;
            existingAvatar.ContentType = contentType;
            existingAvatar.FileSizeInBytes = storageResult.FileSizeInBytes ?? 0;
            existingAvatar.StoragePath = storageResult.StoragePath!;
            existingAvatar.FileHash = storageResult.FileHash;
            existingAvatar.UploadedAt = DateTime.UtcNow;
            existingAvatar.UploadedByUserId = userId;

            try
            {
                await _attachmentsRepository.UpdateAsync(existingAvatar);
            }
            catch
            {
                await DeleteStorageFileBestEffort(storageResult.StoragePath!);
                throw;
            }

            if (!await _storageService.DeleteFileAsync(previousStoragePath))
                _logger.LogWarning("Unable to delete previous avatar object {StoragePath}", previousStoragePath);

            return existingAvatar;
        }

        var attachment = new Attachment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            OrganizationId = null,
            AttachmentType = AttachmentType.UserAvatar,
            FileName = storageResult.FileName!,
            OriginalFileName = fileName,
            ContentType = contentType,
            FileSizeInBytes = storageResult.FileSizeInBytes ?? 0,
            StoragePath = storageResult.StoragePath!,
            FileCategory = FileCategory.Other,
            FileHash = storageResult.FileHash,
            UploadedAt = DateTime.UtcNow,
            UploadedByUserId = userId
        };

        try
        {
            await _attachmentsRepository.CreateAsync(attachment);
        }
        catch
        {
            await DeleteStorageFileBestEffort(storageResult.StoragePath!);
            throw;
        }

        return attachment;
    }

    public async Task<(Stream stream, string fileName, string contentType)> GetUserAvatarAsync(string userId)
    {
        var attachment = await _attachmentsRepository.GetUserAvatarAsync(userId)
            ?? throw new KeyNotFoundException("Avatar not found.");

        var stream = await _storageService.GetFileAsync(attachment.StoragePath);
        return (stream, attachment.OriginalFileName, attachment.ContentType);
    }

    public async Task<(Stream stream, string fileName, string contentType)> GetDocumentAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType)
    {
        var attachment = await GetOwnedDocumentAsync(
            organizationId,
            ownerId,
            attachmentId,
            attachmentType);

        var stream = await _storageService.GetFileAsync(attachment.StoragePath);
        return (stream, attachment.OriginalFileName, attachment.ContentType);
    }

    public async Task<AttachmentDownloadUrlResult> GetDocumentDownloadUrlAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType)
    {
        var attachment = await GetOwnedDocumentAsync(
            organizationId,
            ownerId,
            attachmentId,
            attachmentType);

        var urlResult = await _storageService.CreateDownloadUrlAsync(
            attachment.StoragePath,
            attachment.OriginalFileName,
            attachment.ContentType,
            DocumentDownloadUrlExpiration);

        return new AttachmentDownloadUrlResult(
            urlResult.Url,
            attachment.OriginalFileName,
            attachment.ContentType,
            urlResult.ExpiresAt);
    }

    public async Task<bool> DeleteDocumentAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType)
    {
        var attachment = await GetOwnedDocumentAsync(
            organizationId,
            ownerId,
            attachmentId,
            attachmentType);

        return await DeleteAttachmentAsync(attachment.Id);
    }

    public async Task<bool> DeleteUserAvatarAsync(string userId)
    {
        var avatar = await _attachmentsRepository.GetUserAvatarAsync(userId);
        return avatar is not null && await DeleteAttachmentAsync(avatar.Id);
    }

    public async Task<bool> DeleteAttachmentAsync(Guid attachmentId)
    {
        var attachment = await _attachmentsRepository.GetByIdAsync(attachmentId);
        if (attachment is null)
            return false;

        await _storageService.DeleteFileAsync(attachment.StoragePath);
        await _attachmentsRepository.DeleteAsync(attachment);
        return true;
    }

    private void ValidateFile(Stream fileStream, string fileName, string contentType, FileUploadRules rules)
    {
        var validationResult = _fileValidationService.ValidateFile(fileStream, fileName, fileStream.Length, contentType, rules);

        if (!validationResult.IsValid)
        {
            _logger.LogWarning("File validation failed for {FileName}: {Errors}", fileName, validationResult.ErrorMessage);
            throw new RequestValidationException(validationResult.ErrorMessage);
        }
    }

    private async Task ValidateStorageEntitlement(Guid organizationId, long fileSize)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId)
            ?? throw new KeyNotFoundException($"Organization {organizationId} not found.");

        var entitlement = PlanEntitlement.For(organization.EffectivePlanTier);

        if (!entitlement.HasFileAttachments)
            throw new PlanLimitExceededException("File attachments are not available on your current plan.");

        var currentStorageBytes = await _attachmentsRepository.GetTotalStorageByOrganizationAsync(organizationId);
        if (currentStorageBytes + fileSize > entitlement.MaxStorageBytes)
            throw new PlanLimitExceededException(
                $"Storage limit of {entitlement.MaxStorageBytes / (1024 * 1024)} MB reached.");
    }

    private async Task<FileStorageResult> SaveFileToStorage(
        Stream fileStream, string fileName, string contentType, string directoryPath)
    {
        var storageResult = await _storageService.SaveFileAsync(fileStream, fileName, contentType, directoryPath);

        if (!storageResult.Success)
            throw new Exception($"Failed to save file: {storageResult.ErrorMessage}");

        return storageResult;
    }

    private async Task<Attachment> GetOwnedDocumentAsync(
        Guid organizationId,
        Guid ownerId,
        Guid attachmentId,
        AttachmentType attachmentType)
    {
        var attachment = await _attachmentsRepository.GetByIdAsync(attachmentId);
        var belongsToOwner = attachmentType switch
        {
            AttachmentType.BillDocument => attachment?.BillId == ownerId,
            AttachmentType.ExpenseDocument => attachment?.ExpenseId == ownerId,
            _ => throw new ArgumentOutOfRangeException(
                nameof(attachmentType),
                attachmentType,
                "Only bill and expense documents are supported.")
        };

        if (attachment is null ||
            attachment.OrganizationId != organizationId ||
            attachment.AttachmentType != attachmentType ||
            !belongsToOwner)
        {
            throw new KeyNotFoundException($"Attachment {attachmentId} not found.");
        }

        return attachment;
    }

    private async Task DeleteStorageFileBestEffort(string storagePath)
    {
        if (!await _storageService.DeleteFileAsync(storagePath))
            _logger.LogWarning("Unable to clean up storage object {StoragePath}", storagePath);
    }
}
