using BitFinance.API.Models;
using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class OrganizationsServiceTests
{
    private readonly Mock<IOrganizationsRepository> _orgRepoMock;
    private readonly Mock<IBudgetsRepository> _budgetRepoMock;
    private readonly Mock<IAttachmentsRepository> _attachmentsRepoMock;
    private readonly Mock<IFileStorageService> _storageServiceMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<ITransactionRunner> _transactionRunnerMock;
    private readonly OrganizationsService _sut;

    public OrganizationsServiceTests()
    {
        _orgRepoMock = new Mock<IOrganizationsRepository>();
        _budgetRepoMock = new Mock<IBudgetsRepository>();
        _attachmentsRepoMock = new Mock<IAttachmentsRepository>();
        _storageServiceMock = new Mock<IFileStorageService>();
        _notificationServiceMock = new Mock<INotificationService>();
        _transactionRunnerMock = new Mock<ITransactionRunner>();
        _transactionRunnerMock
            .Setup(runner => runner.ExecuteAsync(It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>()))
            .Returns((Func<Task> operation, CancellationToken _) => operation());
        _sut = new OrganizationsService(
            _orgRepoMock.Object,
            _budgetRepoMock.Object,
            _attachmentsRepoMock.Object,
            _storageServiceMock.Object,
            _notificationServiceMock.Object,
            _transactionRunnerMock.Object,
            NullLogger<OrganizationsService>.Instance);
    }

    private Organization CreateOrganizationWithMembers(List<(string UserId, OrgRole Role)> members)
    {
        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Org",
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var (userId, role) in members)
        {
            org.Members.Add(new OrganizationMember
            {
                UserId = userId,
                OrganizationId = org.Id,
                Role = role,
                JoinedAt = DateTime.UtcNow,
                User = new User
                {
                    Id = userId,
                    UserName = $"user_{userId}",
                    Email = $"user_{userId}@test.com",
                },
            });
        }

        _orgRepoMock.Setup(r => r.GetByIdAsync(org.Id)).ReturnsAsync(org);

        return org;
    }

    // ===== UpdateMemberRoleAsync Tests =====

    [Fact]
    public async Task UpdateMemberRole_OwnerCanDemoteAdmin_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "admin1", OrgRole.Member, "owner1");

        Assert.True(result.Success);
        Assert.Equal(OrgRole.Member, org.Members.Single(m => m.UserId == "admin1").Role);
        _orgRepoMock.Verify(r => r.UpdateAsync(org), Times.Once);
        _notificationServiceMock.Verify(service => service.EnqueueAsync(
            org.Id,
            NotificationType.MemberRoleChanged,
            "admin1",
            It.Is<string>(key => key.StartsWith("membership:role:")),
            It.Is<NotificationEventPayload>(payload => payload.PreviousRole == "Admin" && payload.NewRole == "Member"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task UpdateMemberRole_OwnerCanPromoteMember_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "member1", OrgRole.Admin, "owner1");

        Assert.True(result.Success);
        Assert.Equal(OrgRole.Admin, org.Members.Single(m => m.UserId == "member1").Role);
    }

    [Fact]
    public async Task UpdateMemberRole_AdminCannotUpdateRoles_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "member1", OrgRole.Admin, "admin1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.NotAuthorized, result.Error);
    }

    [Fact]
    public async Task UpdateMemberRole_MemberCannotUpdateRoles_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "owner1", OrgRole.Member, "member1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.NotAuthorized, result.Error);
    }

    [Fact]
    public async Task UpdateMemberRole_CannotPromoteToOwner_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "member1", OrgRole.Owner, "owner1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.CannotPromoteToOwner, result.Error);
    }

    [Fact]
    public async Task UpdateMemberRole_OwnerCannotChangeAnotherOwnerRole_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("owner2", OrgRole.Owner),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "owner2", OrgRole.Admin, "owner1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.CannotManageOwner, result.Error);
    }

    [Fact]
    public async Task UpdateMemberRole_OwnerCanDemoteThemselvesIfMultipleOwners_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("owner2", OrgRole.Owner),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "owner1", OrgRole.Admin, "owner1");

        Assert.True(result.Success);
        Assert.Equal(OrgRole.Admin, org.Members.Single(m => m.UserId == "owner1").Role);
    }

    [Fact]
    public async Task UpdateMemberRole_LastOwnerCannotDemoteThemselves_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "owner1", OrgRole.Member, "owner1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.CannotDemoteLastOwner, result.Error);
    }

    [Fact]
    public async Task UpdateMemberRole_TargetNotMember_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
        ]);

        var result = await _sut.UpdateMemberRoleAsync(org.Id, "nonexistent", OrgRole.Admin, "owner1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.MemberNotFound, result.Error);
    }

    [Fact]
    public async Task UpdateMemberRole_OrganizationNotFound_ShouldFail()
    {
        var orgId = Guid.NewGuid();
        _orgRepoMock.Setup(r => r.GetByIdAsync(orgId)).ReturnsAsync((Organization?)null);

        var result = await _sut.UpdateMemberRoleAsync(orgId, "user1", OrgRole.Admin, "owner1");

        Assert.False(result.Success);
        Assert.Equal(UpdateMemberRoleError.OrganizationNotFound, result.Error);
    }

    // ===== RemoveMemberAsync Tests =====

    [Fact]
    public async Task RemoveMember_OwnerCanRemoveAdmin_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "admin1", "owner1");

        Assert.True(result.Success);
        Assert.Single(org.Members);
        Assert.DoesNotContain(org.Members, m => m.UserId == "admin1");
        _orgRepoMock.Verify(r => r.UpdateAsync(org), Times.Once);
        _notificationServiceMock.Verify(service => service.EnqueueAsync(
            org.Id,
            NotificationType.MemberRemoved,
            "admin1",
            It.Is<string>(key => key.StartsWith("membership:removed:")),
            It.Is<NotificationEventPayload>(payload => payload.MemberUserId == "admin1"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task RemoveMember_OwnerCanRemoveMember_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "member1", "owner1");

        Assert.True(result.Success);
        Assert.Single(org.Members);
    }

    [Fact]
    public async Task RemoveMember_AdminCanRemoveMember_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "member1", "admin1");

        Assert.True(result.Success);
        Assert.Equal(2, org.Members.Count);
    }

    [Fact]
    public async Task RemoveMember_AdminCannotRemoveAdmin_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
            ("admin2", OrgRole.Admin),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "admin2", "admin1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.NotAuthorized, result.Error);
    }

    [Fact]
    public async Task RemoveMember_AdminCannotRemoveOwner_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "owner1", "admin1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.NotAuthorized, result.Error);
    }

    [Fact]
    public async Task RemoveMember_MemberCannotRemoveOthers_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
            ("member2", OrgRole.Member),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "member2", "member1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.NotAuthorized, result.Error);
    }

    [Fact]
    public async Task RemoveMember_OwnerCannotRemoveAnotherOwner_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("owner2", OrgRole.Owner),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "owner2", "owner1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.CannotRemoveOwner, result.Error);
    }

    [Fact]
    public async Task RemoveMember_MemberCanLeaveOrganization_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "member1", "member1");

        Assert.True(result.Success);
        Assert.Single(org.Members);
    }

    [Fact]
    public async Task RemoveMember_AdminCanLeaveOrganization_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "admin1", "admin1");

        Assert.True(result.Success);
        Assert.Single(org.Members);
    }

    [Fact]
    public async Task RemoveMember_OwnerCanLeaveIfMultipleOwners_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("owner2", OrgRole.Owner),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "owner1", "owner1");

        Assert.True(result.Success);
        Assert.Single(org.Members);
    }

    [Fact]
    public async Task RemoveMember_LastOwnerCannotLeave_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "owner1", "owner1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.CannotRemoveLastOwner, result.Error);
    }

    [Fact]
    public async Task RemoveMember_TargetNotMember_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
        ]);

        var result = await _sut.RemoveMemberAsync(org.Id, "nonexistent", "owner1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.MemberNotFound, result.Error);
    }

    [Fact]
    public async Task RemoveMember_OrganizationNotFound_ShouldFail()
    {
        var orgId = Guid.NewGuid();
        _orgRepoMock.Setup(r => r.GetByIdAsync(orgId)).ReturnsAsync((Organization?)null);

        var result = await _sut.RemoveMemberAsync(orgId, "user1", "owner1");

        Assert.False(result.Success);
        Assert.Equal(RemoveMemberError.OrganizationNotFound, result.Error);
    }

    // ===== UpdateAsync / UpsertBudgetAsync Tests =====

    [Theory]
    [InlineData(OrgRole.Owner)]
    [InlineData(OrgRole.Admin)]
    public async Task Update_OwnerOrAdmin_ShouldSucceed(OrgRole role)
    {
        var org = CreateOrganizationWithMembers([("user1", role)]);

        var result = await _sut.UpdateAsync(org.Id, "Renamed", "user1");

        Assert.True(result.Success);
        Assert.Equal("Renamed", org.Name);
        _orgRepoMock.Verify(r => r.UpdateAsync(org), Times.Once);
    }

    [Fact]
    public async Task Update_Member_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpdateAsync(org.Id, "Renamed", "member1");

        Assert.False(result.Success);
        Assert.Equal(OrganizationActionError.NotAuthorized, result.Error);
        Assert.Equal("Test Org", org.Name);
        _orgRepoMock.Verify(r => r.UpdateAsync(It.IsAny<Organization>()), Times.Never);
    }

    [Fact]
    public async Task UpsertBudget_Member_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.UpsertBudgetAsync(org.Id, 1000M, "member1");

        Assert.False(result.Success);
        Assert.Equal(OrganizationActionError.NotAuthorized, result.Error);
        _budgetRepoMock.Verify(r => r.UpsertByOrganizationIdAsync(It.IsAny<Guid>(), It.IsAny<decimal>()), Times.Never);
    }

    [Fact]
    public async Task UpsertBudget_Admin_ShouldSucceed()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);
        var budget = new Budget { Id = Guid.NewGuid(), OrganizationId = org.Id, Amount = 1000M };
        _budgetRepoMock.Setup(r => r.UpsertByOrganizationIdAsync(org.Id, 1000M)).ReturnsAsync(budget);

        var result = await _sut.UpsertBudgetAsync(org.Id, 1000M, "admin1");

        Assert.True(result.Success);
        Assert.Same(budget, result.Value);
    }

    // ===== TransferOwnershipAsync Tests =====

    [Fact]
    public async Task TransferOwnership_OwnerToMember_ShouldSwapRoles()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.TransferOwnershipAsync(org.Id, "member1", "owner1");

        Assert.True(result.Success);
        Assert.Equal(OrgRole.Owner, org.Members.Single(m => m.UserId == "member1").Role);
        Assert.Equal(OrgRole.Admin, org.Members.Single(m => m.UserId == "owner1").Role);
        _orgRepoMock.Verify(r => r.UpdateAsync(org), Times.Once);
        _notificationServiceMock.Verify(service => service.EnqueueAsync(
            org.Id,
            NotificationType.MemberRoleChanged,
            "member1",
            It.Is<string>(key => key.StartsWith("membership:role:")),
            It.Is<NotificationEventPayload>(payload => payload.PreviousRole == "Member" && payload.NewRole == "Owner"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TransferOwnership_Admin_ShouldFail()
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
            ("member1", OrgRole.Member),
        ]);

        var result = await _sut.TransferOwnershipAsync(org.Id, "member1", "admin1");

        Assert.False(result.Success);
        Assert.Equal(OrganizationActionError.NotAuthorized, result.Error);
        Assert.Equal(OrgRole.Member, org.Members.Single(m => m.UserId == "member1").Role);
    }

    [Fact]
    public async Task TransferOwnership_ToSelf_ShouldFail()
    {
        var org = CreateOrganizationWithMembers([("owner1", OrgRole.Owner)]);

        var result = await _sut.TransferOwnershipAsync(org.Id, "owner1", "owner1");

        Assert.False(result.Success);
        Assert.Equal(OrganizationActionError.InvalidTarget, result.Error);
    }

    [Fact]
    public async Task TransferOwnership_TargetNotMember_ShouldFail()
    {
        var org = CreateOrganizationWithMembers([("owner1", OrgRole.Owner)]);

        var result = await _sut.TransferOwnershipAsync(org.Id, "stranger", "owner1");

        Assert.False(result.Success);
        Assert.Equal(OrganizationActionError.MemberNotFound, result.Error);
    }

    // ===== DeleteAsync Tests =====

    [Fact]
    public async Task Delete_Owner_ShouldDeleteOrganizationAndStoredFiles()
    {
        var org = CreateOrganizationWithMembers([("owner1", OrgRole.Owner)]);
        _attachmentsRepoMock
            .Setup(r => r.GetStoragePathsByOrganizationAsync(org.Id))
            .ReturnsAsync(["bills/a.pdf", "expenses/b.png"]);
        _storageServiceMock.Setup(s => s.DeleteFileAsync(It.IsAny<string>())).ReturnsAsync(true);

        var result = await _sut.DeleteAsync(org.Id, "owner1");

        Assert.True(result.Success);
        _orgRepoMock.Verify(r => r.DeleteAsync(org), Times.Once);
        _storageServiceMock.Verify(s => s.DeleteFileAsync("bills/a.pdf"), Times.Once);
        _storageServiceMock.Verify(s => s.DeleteFileAsync("expenses/b.png"), Times.Once);
    }

    [Theory]
    [InlineData(OrgRole.Admin)]
    [InlineData(OrgRole.Member)]
    public async Task Delete_NonOwner_ShouldFail(OrgRole role)
    {
        var org = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("user1", role),
        ]);

        var result = await _sut.DeleteAsync(org.Id, "user1");

        Assert.False(result.Success);
        Assert.Equal(OrganizationActionError.NotAuthorized, result.Error);
        _orgRepoMock.Verify(r => r.DeleteAsync(It.IsAny<Organization>()), Times.Never);
        _storageServiceMock.Verify(s => s.DeleteFileAsync(It.IsAny<string>()), Times.Never);
    }
}
