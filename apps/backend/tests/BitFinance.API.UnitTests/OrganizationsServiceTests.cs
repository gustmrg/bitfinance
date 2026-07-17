using BitFinance.API.Models;
using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class OrganizationsServiceTests
{
    private readonly Mock<IOrganizationsRepository> _orgRepoMock;
    private readonly Mock<IBudgetsRepository> _budgetRepoMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<ITransactionRunner> _transactionRunnerMock;
    private readonly OrganizationsService _sut;

    public OrganizationsServiceTests()
    {
        _orgRepoMock = new Mock<IOrganizationsRepository>();
        _budgetRepoMock = new Mock<IBudgetsRepository>();
        _notificationServiceMock = new Mock<INotificationService>();
        _transactionRunnerMock = new Mock<ITransactionRunner>();
        _transactionRunnerMock
            .Setup(runner => runner.ExecuteAsync(It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>()))
            .Returns((Func<Task> operation, CancellationToken _) => operation());
        _sut = new OrganizationsService(
            _orgRepoMock.Object,
            _budgetRepoMock.Object,
            _notificationServiceMock.Object,
            _transactionRunnerMock.Object);
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
}
