using BitFinance.API.Models;
using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class InvitationsServiceTests
{
    private readonly Mock<IInvitationsRepository> _invitationsRepositoryMock;
    private readonly Mock<IOrganizationsRepository> _organizationsRepositoryMock;
    private readonly Mock<INotificationService> _notificationServiceMock;
    private readonly Mock<ITransactionRunner> _transactionRunnerMock;
    private readonly InvitationsService _sut;

    public InvitationsServiceTests()
    {
        _invitationsRepositoryMock = new Mock<IInvitationsRepository>();
        _organizationsRepositoryMock = new Mock<IOrganizationsRepository>();
        _notificationServiceMock = new Mock<INotificationService>();
        _transactionRunnerMock = new Mock<ITransactionRunner>();
        _transactionRunnerMock
            .Setup(runner => runner.ExecuteAsync(It.IsAny<Func<Task>>(), It.IsAny<CancellationToken>()))
            .Returns((Func<Task> operation, CancellationToken _) => operation());
        _sut = new InvitationsService(
            _invitationsRepositoryMock.Object,
            _organizationsRepositoryMock.Object,
            _notificationServiceMock.Object,
            _transactionRunnerMock.Object);
    }

    private Organization CreateOrganizationWithMembers(List<(string UserId, OrgRole Role)> members)
    {
        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test Org",
            PlanTier = PlanTier.Premium,
            CreatedAt = DateTime.UtcNow,
        };

        foreach (var (userId, role) in members)
        {
            organization.Members.Add(new OrganizationMember
            {
                UserId = userId,
                OrganizationId = organization.Id,
                Role = role,
                JoinedAt = DateTime.UtcNow,
            });
        }

        _organizationsRepositoryMock
            .Setup(repository => repository.GetByIdAsync(organization.Id))
            .ReturnsAsync(organization);

        return organization;
    }

    [Fact]
    public async Task CreateInvitation_OwnerCanInviteAdmin_ShouldSucceed()
    {
        var organization = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        _invitationsRepositoryMock
            .Setup(repository => repository.CreateAsync(It.IsAny<Invitation>()))
            .ReturnsAsync((Invitation invitation) => invitation);

        var result = await _sut.CreateInvitationAsync(
            organization.Id,
            "new-admin@test.com",
            OrgRole.Admin,
            "owner1");

        Assert.True(result.Success);
        Assert.Equal(OrgRole.Admin, result.Invitation?.Role);
        _invitationsRepositoryMock.Verify(
            repository => repository.CreateAsync(It.IsAny<Invitation>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateInvitation_AdminCannotInviteAdmin_ShouldFail()
    {
        var organization = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        var result = await _sut.CreateInvitationAsync(
            organization.Id,
            "new-admin@test.com",
            OrgRole.Admin,
            "admin1");

        Assert.False(result.Success);
        Assert.Equal(CreateInvitationError.NotAuthorized, result.Error);
        _invitationsRepositoryMock.Verify(
            repository => repository.CreateAsync(It.IsAny<Invitation>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateInvitation_AdminCanInviteMember_ShouldSucceed()
    {
        var organization = CreateOrganizationWithMembers(
        [
            ("owner1", OrgRole.Owner),
            ("admin1", OrgRole.Admin),
        ]);

        _invitationsRepositoryMock
            .Setup(repository => repository.CreateAsync(It.IsAny<Invitation>()))
            .ReturnsAsync((Invitation invitation) => invitation);

        var result = await _sut.CreateInvitationAsync(
            organization.Id,
            "member@test.com",
            OrgRole.Member,
            "admin1");

        Assert.True(result.Success);
        Assert.Equal(OrgRole.Member, result.Invitation?.Role);
    }

    [Fact]
    public async Task JoinOrganization_ValidInvitation_ShouldEnqueueMemberJoined()
    {
        var organization = CreateOrganizationWithMembers([("owner1", OrgRole.Owner)]);
        var invitation = new Invitation
        {
            Id = Guid.NewGuid(),
            OrganizationId = organization.Id,
            Organization = organization,
            Email = "new-member@test.com",
            Role = OrgRole.Member,
            Status = InvitationStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddHours(1),
        };
        _invitationsRepositoryMock
            .Setup(repository => repository.GetByTokenHashAsync(It.IsAny<string>()))
            .ReturnsAsync(invitation);

        var result = await _sut.JoinOrganizationAsync("raw-token", "member1", "new-member@test.com");

        Assert.True(result.Success);
        Assert.Contains(organization.Members, member => member.UserId == "member1");
        _notificationServiceMock.Verify(service => service.EnqueueAsync(
            organization.Id,
            NotificationType.MemberJoined,
            "member1",
            $"membership:joined:{invitation.Id:N}",
            It.Is<NotificationEventPayload>(payload => payload.MemberUserId == "member1"),
            It.IsAny<CancellationToken>()), Times.Once);
    }
}
