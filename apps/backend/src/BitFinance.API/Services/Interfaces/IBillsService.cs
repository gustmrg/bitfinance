using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Provides operations for querying and managing bills.
/// </summary>
public interface IBillsService
{
    /// <summary>
    /// Retrieves the list of upcoming (unpaid) bills for an organization.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <returns>A list of upcoming <see cref="Bill"/> entities.</returns>
    Task<List<Bill>> GetUpcomingBills(Guid organizationId);
}
