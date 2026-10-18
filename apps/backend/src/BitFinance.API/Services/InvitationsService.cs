using BitFinance.API.Models;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Helpers;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class InvitationsService : IInvitationsService
{
    private readonly IInvitationsRepository _invitationsRepository;
    private readonly IOrganizationsRepository _organizationsRepository;
    private readonly INotificationService _notificationService;
    private readonly ITransactionRunner _transactionRunner;

    public InvitationsService(
        IInvitationsRepository invitationsRepository,
        IOrganizationsRepository organizationsRepository,
        INotificationService notificationService,
        ITransactionRunner transactionRunner)
    {
        _invitationsRepository = invitationsRepository;
        _organizationsRepository = organizationsRepository;
        _notificationService = notificationService;
        _transactionRunner = transactionRunner;
    }

    public async Task<CreateInvitationResult> CreateInvitationAsync(
        Guid organizationId, string email, OrgRole role, string invitedByUserId)
    {
        if (role == OrgRole.Owner)
            return CreateInvitationResult.Failed(CreateInvitationError.InvalidRole, "Cannot invite a user as Owner");

        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return CreateInvitationResult.Failed(CreateInvitationError.OrganizationNotFound, "Organization not found");

        var inviterMembership = organization.Members.FirstOrDefault(m => m.UserId == invitedByUserId);

        if (inviterMembership is null || (inviterMembership.Role != OrgRole.Owner && inviterMembership.Role != OrgRole.Admin))
            return CreateInvitationResult.Failed(CreateInvitationError.NotAuthorized, "Only owners and admins can create invitations");

        if (inviterMembership.Role == OrgRole.Admin && role != OrgRole.Member)
            return CreateInvitationResult.Failed(CreateInvitationError.NotAuthorized, "Admins can only invite members");

        var entitlement = PlanEntitlement.For(organization.EffectivePlanTier);
        if (organization.Members.Count >= entitlement.MaxMembers)
            return CreateInvitationResult.Failed(CreateInvitationError.PlanLimitReached,
                $"Your plan allows a maximum of {entitlement.MaxMembers} members.");

        var rawToken = TokenHasher.GenerateToken();

        var invitation = new Invitation
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
            Email = email,
            Role = role,
            InvitedByUserId = invitedByUserId,
            Status = InvitationStatus.Pending,
            TokenHash = TokenHasher.HashToken(rawToken),
            ExpiresAt = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow,
        };

        await _invitationsRepository.CreateAsync(invitation);
        return CreateInvitationResult.Succeeded(invitation, rawToken);
    }

    public async Task<OrganizationActionResult<List<Invitation>>> GetPendingInvitationsAsync(
        Guid organizationId, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return OrganizationActionResult<List<Invitation>>.Failed(OrganizationActionError.OrganizationNotFound, "Organization not found");

        var actingRole = organization.Members.FirstOrDefault(m => m.UserId == actingUserId)?.Role;

        if (actingRole is not (OrgRole.Owner or OrgRole.Admin))
            return OrganizationActionResult<List<Invitation>>.Failed(OrganizationActionError.NotAuthorized, "Only owners and admins can view invitations");

        var invitations = await _invitationsRepository.GetPendingByOrganizationAsync(organizationId, DateTime.UtcNow);
        return OrganizationActionResult<List<Invitation>>.Succeeded(invitations);
    }

    public async Task<OrganizationActionResult<Invitation>> RevokeInvitationAsync(
        Guid organizationId, Guid invitationId, string actingUserId)
    {
        var lookup = await GetManageablePendingInvitationAsync(organizationId, invitationId, actingUserId);

        if (!lookup.Success)
            return lookup;

        var invitation = lookup.Value!;
        invitation.Status = InvitationStatus.Revoked;
        await _invitationsRepository.UpdateAsync(invitation);
        return OrganizationActionResult<Invitation>.Succeeded(invitation);
    }

    public async Task<CreateInvitationResult> RenewInvitationAsync(
        Guid organizationId, Guid invitationId, string actingUserId)
    {
        var lookup = await GetManageablePendingInvitationAsync(organizationId, invitationId, actingUserId);

        if (!lookup.Success)
        {
            return lookup.Error switch
            {
                OrganizationActionError.NotAuthorized => CreateInvitationResult.Failed(CreateInvitationError.NotAuthorized, lookup.ErrorMessage!),
                OrganizationActionError.InvitationNotFound => CreateInvitationResult.Failed(CreateInvitationError.InvitationNotFound, lookup.ErrorMessage!),
                _ => CreateInvitationResult.Failed(CreateInvitationError.OrganizationNotFound, lookup.ErrorMessage!),
            };
        }

        var invitation = lookup.Value!;
        var rawToken = TokenHasher.GenerateToken();
        invitation.TokenHash = TokenHasher.HashToken(rawToken);
        invitation.ExpiresAt = DateTime.UtcNow.AddDays(1);
        await _invitationsRepository.UpdateAsync(invitation);
        return CreateInvitationResult.Succeeded(invitation, rawToken);
    }

    private async Task<OrganizationActionResult<Invitation>> GetManageablePendingInvitationAsync(
        Guid organizationId, Guid invitationId, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return OrganizationActionResult<Invitation>.Failed(OrganizationActionError.OrganizationNotFound, "Organization not found");

        var actingRole = organization.Members.FirstOrDefault(m => m.UserId == actingUserId)?.Role;

        if (actingRole is not (OrgRole.Owner or OrgRole.Admin))
            return OrganizationActionResult<Invitation>.Failed(OrganizationActionError.NotAuthorized, "Only owners and admins can manage invitations");

        var invitation = await _invitationsRepository.GetByIdAsync(invitationId);

        if (invitation is null || invitation.OrganizationId != organizationId || invitation.Status != InvitationStatus.Pending)
            return OrganizationActionResult<Invitation>.Failed(OrganizationActionError.InvitationNotFound, "Invitation not found");

        if (actingRole == OrgRole.Admin && invitation.Role != OrgRole.Member)
            return OrganizationActionResult<Invitation>.Failed(OrganizationActionError.NotAuthorized, "Admins can only manage member invitations");

        return OrganizationActionResult<Invitation>.Succeeded(invitation);
    }

    public async Task<JoinOrganizationResult> JoinOrganizationAsync(string token, string userId, string userEmail)
    {
        var tokenHash = TokenHasher.HashToken(token);
        var invitation = await _invitationsRepository.GetByTokenHashAsync(tokenHash);

        if (invitation is null)
            return JoinOrganizationResult.Failed(JoinOrganizationError.InvalidToken, "Invalid invitation");

        if (invitation.Status != InvitationStatus.Pending)
            return JoinOrganizationResult.Failed(JoinOrganizationError.InvitationNotPending, "This invitation is no longer valid");

        if (invitation.ExpiresAt < DateTime.UtcNow)
            return JoinOrganizationResult.Failed(JoinOrganizationError.InvitationExpired, "This invitation has expired");

        if (!string.Equals(invitation.Email, userEmail, StringComparison.OrdinalIgnoreCase))
            return JoinOrganizationResult.Failed(JoinOrganizationError.EmailMismatch, "This invitation was sent to a different email address");

        var organization = invitation.Organization;

        if (organization is null)
            return JoinOrganizationResult.Failed(JoinOrganizationError.OrganizationNotFound, "Organization not found");

        if (organization.Members.Any(m => m.UserId == userId))
            return JoinOrganizationResult.Failed(JoinOrganizationError.AlreadyMember, "You are already a member of this organization");

        var member = new OrganizationMember
        {
            UserId = userId,
            OrganizationId = organization.Id,
            Role = invitation.Role,
            JoinedAt = DateTime.UtcNow,
        };
        organization.Members.Add(member);

        invitation.Status = InvitationStatus.Accepted;

        await _transactionRunner.ExecuteAsync(async () =>
        {
            await _organizationsRepository.UpdateAsync(organization);
            await _invitationsRepository.UpdateAsync(invitation);
            await _notificationService.EnqueueAsync(
                organization.Id,
                NotificationType.MemberJoined,
                userId,
                $"membership:joined:{invitation.Id:N}",
                new NotificationEventPayload(
                    MemberUserId: userId,
                    MemberName: userEmail));
        });

        return JoinOrganizationResult.Succeeded(organization);
    }
}
