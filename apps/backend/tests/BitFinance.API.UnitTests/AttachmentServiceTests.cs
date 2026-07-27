using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class AttachmentServiceTests
{
    private readonly Mock<IFileStorageService> _storage = new();
    private readonly Mock<IFileValidationService> _validation = new();
    private readonly Mock<IAttachmentsRepository> _attachments = new();
    private readonly Mock<IBillsRepository> _bills = new();
    private readonly Mock<IExpensesRepository> _expenses = new();
    private readonly Mock<IOrganizationsRepository> _organizations = new();
    private readonly AttachmentService _service;

    public AttachmentServiceTests()
    {
        _validation
            .Setup(service => service.ValidateFile(
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<long>(),
                It.IsAny<string>(),
                It.IsAny<FileUploadRules>()))
            .Returns(new FileValidationResult { IsValid = true });

        _service = new AttachmentService(
            _storage.Object,
            _validation.Object,
            _attachments.Object,
            Mock.Of<ILogger<AttachmentService>>(),
            _bills.Object,
            _expenses.Object,
            _organizations.Object);
    }

    [Theory]
    [InlineData(PlanTier.Free, false)]
    [InlineData(PlanTier.Basic, true)]
    public async Task UploadExpenseAttachment_FreeEffectivePlan_DoesNotWriteStorage(
        PlanTier planTier,
        bool expired)
    {
        var organizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        _expenses
            .Setup(repository => repository.GetByIdAsync(expenseId))
            .ReturnsAsync(new Expense { Id = expenseId, OrganizationId = organizationId });
        _organizations
            .Setup(repository => repository.GetByIdAsync(organizationId))
            .ReturnsAsync(new Organization
            {
                Id = organizationId,
                Name = "Test",
                PlanTier = planTier,
                PlanExpiresAt = expired ? DateTime.UtcNow.AddMinutes(-1) : DateTime.UtcNow.AddDays(1)
            });

        await Assert.ThrowsAsync<PlanLimitExceededException>(() =>
            _service.UploadExpenseAttachmentAsync(
                organizationId,
                expenseId,
                CreateFileStream(),
                "receipt.png",
                "image/png",
                FileCategory.Receipt));

        _storage.Verify(
            service => service.SaveFileAsync(
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Never);
        _attachments.Verify(
            repository => repository.CreateAsync(It.IsAny<Attachment>()),
            Times.Never);
    }

    [Fact]
    public async Task UploadExpenseAttachment_MismatchedOrganization_ReturnsNotFoundBeforeEntitlement()
    {
        var routeOrganizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        _expenses
            .Setup(repository => repository.GetByIdAsync(expenseId))
            .ReturnsAsync(new Expense { Id = expenseId, OrganizationId = Guid.NewGuid() });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.UploadExpenseAttachmentAsync(
                routeOrganizationId,
                expenseId,
                CreateFileStream(),
                "receipt.png",
                "image/png",
                FileCategory.Receipt));

        _organizations.Verify(
            repository => repository.GetByIdAsync(It.IsAny<Guid>()),
            Times.Never);
        _storage.Verify(
            service => service.SaveFileAsync(
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task UploadExpenseAttachment_PaidPlan_PersistsOriginalFileName()
    {
        var organizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        _expenses
            .Setup(repository => repository.GetByIdAsync(expenseId))
            .ReturnsAsync(new Expense { Id = expenseId, OrganizationId = organizationId });
        _organizations
            .Setup(repository => repository.GetByIdAsync(organizationId))
            .ReturnsAsync(new Organization
            {
                Id = organizationId,
                Name = "Test",
                PlanTier = PlanTier.Basic,
                PlanExpiresAt = DateTime.UtcNow.AddDays(1)
            });
        _attachments
            .Setup(repository => repository.GetTotalStorageByOrganizationAsync(organizationId))
            .ReturnsAsync(0);
        _storage
            .Setup(service => service.SaveFileAsync(
                It.IsAny<Stream>(),
                "receipt.png",
                "image/png",
                $"organizations/{organizationId}/expenses/{expenseId}"))
            .ReturnsAsync(new FileStorageResult
            {
                Success = true,
                FileName = "stored.png",
                StoragePath = "stored/path.png",
                FileSizeInBytes = 8
            });
        _attachments
            .Setup(repository => repository.CreateAsync(It.IsAny<Attachment>()))
            .ReturnsAsync((Attachment attachment) => attachment);

        var result = await _service.UploadExpenseAttachmentAsync(
            organizationId,
            expenseId,
            CreateFileStream(),
            "receipt.png",
            "image/png",
            FileCategory.Receipt);

        Assert.Equal("receipt.png", result.OriginalFileName);
        Assert.Equal("stored.png", result.FileName);
        Assert.Equal(AttachmentType.ExpenseDocument, result.AttachmentType);
    }

    [Fact]
    public async Task UploadExpenseAttachment_StorageQuotaExceeded_DoesNotWriteStorage()
    {
        var organizationId = Guid.NewGuid();
        var expenseId = Guid.NewGuid();
        _expenses
            .Setup(repository => repository.GetByIdAsync(expenseId))
            .ReturnsAsync(new Expense { Id = expenseId, OrganizationId = organizationId });
        _organizations
            .Setup(repository => repository.GetByIdAsync(organizationId))
            .ReturnsAsync(new Organization
            {
                Id = organizationId,
                Name = "Test",
                PlanTier = PlanTier.Basic,
                PlanExpiresAt = DateTime.UtcNow.AddDays(1)
            });
        _attachments
            .Setup(repository => repository.GetTotalStorageByOrganizationAsync(organizationId))
            .ReturnsAsync(PlanEntitlement.For(PlanTier.Basic).MaxStorageBytes);

        await Assert.ThrowsAsync<PlanLimitExceededException>(() =>
            _service.UploadExpenseAttachmentAsync(
                organizationId,
                expenseId,
                CreateFileStream(),
                "receipt.png",
                "image/png",
                FileCategory.Receipt));

        _storage.Verify(
            service => service.SaveFileAsync(
                It.IsAny<Stream>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task GetDocument_WrongOwner_DoesNotReadStorage()
    {
        var organizationId = Guid.NewGuid();
        var attachmentId = Guid.NewGuid();
        _attachments
            .Setup(repository => repository.GetByIdAsync(attachmentId))
            .ReturnsAsync(new Attachment
            {
                Id = attachmentId,
                OrganizationId = organizationId,
                ExpenseId = Guid.NewGuid(),
                AttachmentType = AttachmentType.ExpenseDocument,
                StoragePath = "stored/path.png"
            });

        await Assert.ThrowsAsync<KeyNotFoundException>(() =>
            _service.GetDocumentAsync(
                organizationId,
                Guid.NewGuid(),
                attachmentId,
                AttachmentType.ExpenseDocument));

        _storage.Verify(
            service => service.GetFileAsync(It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task UploadUserAvatar_ReplacementFailure_PreservesPreviousObject()
    {
        var userId = "user-1";
        var existing = new Attachment
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            AttachmentType = AttachmentType.UserAvatar,
            FileName = "old.png",
            OriginalFileName = "old.png",
            ContentType = "image/png",
            StoragePath = "avatars/old.png"
        };
        _attachments
            .Setup(repository => repository.GetUserAvatarAsync(userId))
            .ReturnsAsync(existing);
        _storage
            .Setup(service => service.SaveFileAsync(
                It.IsAny<Stream>(),
                "new.png",
                "image/png",
                $"users/{userId}/avatar"))
            .ReturnsAsync(new FileStorageResult
            {
                Success = true,
                FileName = "new-stored.png",
                StoragePath = "avatars/new.png",
                FileSizeInBytes = 8
            });
        _attachments
            .Setup(repository => repository.UpdateAsync(existing))
            .ThrowsAsync(new InvalidOperationException("Database unavailable"));
        _storage
            .Setup(service => service.DeleteFileAsync("avatars/new.png"))
            .ReturnsAsync(true);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _service.UploadUserAvatarAsync(
                userId,
                CreateFileStream(),
                "new.png",
                "image/png"));

        _storage.Verify(
            service => service.DeleteFileAsync("avatars/new.png"),
            Times.Once);
        _storage.Verify(
            service => service.DeleteFileAsync("avatars/old.png"),
            Times.Never);
    }

    [Fact]
    public async Task GetUserAvatar_ReturnsAuthenticatedUsersStoredImage()
    {
        var userId = "user-1";
        var storedStream = new MemoryStream([1, 2, 3]);
        _attachments
            .Setup(repository => repository.GetUserAvatarAsync(userId))
            .ReturnsAsync(new Attachment
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                AttachmentType = AttachmentType.UserAvatar,
                OriginalFileName = "avatar.png",
                ContentType = "image/png",
                StoragePath = "avatars/user-1.png"
            });
        _storage
            .Setup(service => service.GetFileAsync("avatars/user-1.png"))
            .ReturnsAsync(storedStream);

        var result = await _service.GetUserAvatarAsync(userId);

        Assert.Same(storedStream, result.stream);
        Assert.Equal("avatar.png", result.fileName);
        Assert.Equal("image/png", result.contentType);
    }

    [Fact]
    public async Task DeleteUserAvatar_WithoutAvatar_ReturnsFalseWithoutStorageCall()
    {
        _attachments
            .Setup(repository => repository.GetUserAvatarAsync("user-1"))
            .ReturnsAsync((Attachment?)null);

        var result = await _service.DeleteUserAvatarAsync("user-1");

        Assert.False(result);
        _storage.Verify(
            service => service.DeleteFileAsync(It.IsAny<string>()),
            Times.Never);
    }

    private static MemoryStream CreateFileStream() => new(new byte[8]);
}
