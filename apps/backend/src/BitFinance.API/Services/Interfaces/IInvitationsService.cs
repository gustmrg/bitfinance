using BitFinance.API.Models;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Provides operations for managing organization invitations.
/// </summary>
public interface IInvitationsService
{
    /// <summary>
    /// Creates a new invitation for a user to join an organization.
    /// Validates that the inviter has Owner or Admin role and that the invited role is not Owner.
    /// </summary>
    /// <param name="organizationId">The organization's ID.</param>
    /// <param name="email">The email address of the invited user.</param>
    /// <param name="role">The role the invited user will have in the organization.</param>
    /// <param name="invitedByUserId">The ID of the user creating the invitation.</param>
    /// <returns>A <see cref="CreateInvitationResult"/> indicating success or the specific failure reason.</returns>
    Task<CreateInvitationResult> CreateInvitationAsync(Guid organizationId, string email, OrgRole role, string invitedByUserId);

    /// <summary>
    /// Lists the pending, unexpired invitations of an organization. Only owners and admins can list them.
    /// </summary>
    Task<OrganizationActionResult<List<Invitation>>> GetPendingInvitationsAsync(Guid organizationId, string actingUserId);

    /// <summary>
    /// Revokes a pending invitation so its link can no longer be used. Admins can only revoke member invitations.
    /// </summary>
    Task<OrganizationActionResult<Invitation>> RevokeInvitationAsync(Guid organizationId, Guid invitationId, string actingUserId);

    /// <summary>
    /// Issues a new token for a pending invitation and extends its expiry. The previous link stops working.
    /// </summary>
    Task<CreateInvitationResult> RenewInvitationAsync(Guid organizationId, Guid invitationId, string actingUserId);

    /// <summary>
    /// Processes accepting an invitation: validates the token, checks expiry and status,
    /// verifies the user's email matches the invitation, prevents duplicate membership,
    /// adds the user as a member, and marks the invitation accepted.
    /// </summary>
    /// <param name="token">The invitation token.</param>
    /// <param name="userId">The ID of the user accepting the invitation.</param>
    /// <param name="userEmail">The email of the user accepting the invitation.</param>
    /// <returns>A <see cref="JoinOrganizationResult"/> indicating success or the specific failure reason.</returns>
    Task<JoinOrganizationResult> JoinOrganizationAsync(string token, string userId, string userEmail);
}
