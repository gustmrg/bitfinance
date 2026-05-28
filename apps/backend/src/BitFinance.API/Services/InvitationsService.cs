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

    public InvitationsService(
        IInvitationsRepository invitationsRepository,
        IOrganizationsRepository organizationsRepository)
    {
        _invitationsRepository = invitationsRepository;
        _organizationsRepository = organizationsRepository;
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

        organization.Members.Add(new OrganizationMember
        {
            UserId = userId,
            OrganizationId = organization.Id,
            Role = invitation.Role,
            JoinedAt = DateTime.UtcNow,
        });

        invitation.Status = InvitationStatus.Accepted;

        await _organizationsRepository.UpdateAsync(organization);
        await _invitationsRepository.UpdateAsync(invitation);

        return JoinOrganizationResult.Succeeded(organization);
    }
}
