using BitFinance.Business.Entities;

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
}
