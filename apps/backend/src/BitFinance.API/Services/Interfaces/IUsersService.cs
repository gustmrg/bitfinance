using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Provides operations for querying and managing application users.
/// </summary>
public interface IUsersService
{
    /// <summary>
    /// Checks whether a user is a member of the specified organization.
    /// </summary>
    /// <param name="userId">The user's ID.</param>
    /// <param name="organizationId">The organization's ID.</param>
    /// <returns><c>true</c> if the user belongs to the organization; otherwise, <c>false</c>.</returns>
    Task<bool> IsUserInOrganizationAsync(string userId, Guid organizationId);

    /// <summary>
    /// Retrieves a user by their ID.
    /// </summary>
    /// <param name="userId">The user's ID.</param>
    /// <returns>The <see cref="User"/> entity, or <c>null</c> if not found.</returns>
    Task<User?> GetUserByIdAsync(string userId);

    /// <summary>
    /// Updates an existing user's information.
    /// </summary>
    /// <param name="user">The user entity with updated values.</param>
    Task UpdateUserAsync(User user);
}
