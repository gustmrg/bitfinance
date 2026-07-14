using BitFinance.API.Models;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Provides operations for querying and managing organizations.
/// </summary>
public interface IOrganizationsService
{
    /// <summary>
    /// Retrieves all organizations a user is a member of.
    /// </summary>
    /// <param name="userId">The user's ID.</param>
    /// <returns>A list of <see cref="Organization"/> entities the user belongs to.</returns>
    Task<List<Organization>> GetAllByUserIdAsync(string userId);

    /// <summary>
    /// Retrieves an organization by its ID, including its members.
    /// </summary>
    /// <param name="organizationId">The organization's ID.</param>
    /// <returns>The <see cref="Organization"/> entity, or <c>null</c> if not found.</returns>
    Task<Organization?> GetByIdAsync(Guid organizationId);

    /// <summary>
    /// Retrieves the configured budget for an organization.
    /// </summary>
    /// <param name="organizationId">The organization's ID.</param>
    /// <returns>The <see cref="Budget"/> entity, or <c>null</c> if no budget is set.</returns>
    Task<Budget?> GetBudgetAsync(Guid organizationId);

    /// <summary>
    /// Creates a new organization and adds the specified user as the Owner.
    /// </summary>
    /// <param name="name">The organization name.</param>
    /// <param name="ownerUserId">The ID of the user who will be the owner.</param>
    /// <returns>The created <see cref="Organization"/> entity.</returns>
    Task<Organization> CreateAsync(string name, string ownerUserId);

    /// <summary>
    /// Updates the name of an existing organization.
    /// </summary>
    /// <param name="organizationId">The organization's ID.</param>
    /// <param name="name">The new name for the organization.</param>
    /// <returns>The updated <see cref="Organization"/> entity, or <c>null</c> if not found.</returns>
    Task<Organization?> UpdateAsync(Guid organizationId, string name);

    /// <summary>
    /// Creates or updates the configured budget for an organization.
    /// </summary>
    /// <param name="organizationId">The organization's ID.</param>
    /// <param name="amount">The monthly budget amount.</param>
    /// <returns>The created or updated <see cref="Budget"/> entity.</returns>
    Task<Budget> UpsertBudgetAsync(Guid organizationId, decimal amount);

    /// <summary>
    /// Updates the role of a member in the organization.
    /// Only owners can update roles, and they cannot promote to Owner, demote the last owner, or change another owner's role.
    /// </summary>
    Task<UpdateMemberRoleResult> UpdateMemberRoleAsync(Guid organizationId, string targetUserId, OrgRole newRole, string actingUserId);

    /// <summary>
    /// Removes a member from the organization.
    /// Owners can remove admins and members. Admins can remove members only.
    /// The last owner cannot be removed. A member can remove themselves (leave) unless they are the last owner.
    /// </summary>
    Task<RemoveMemberResult> RemoveMemberAsync(Guid organizationId, string targetUserId, string actingUserId);
}
