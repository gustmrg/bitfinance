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
    Task<List<Bill>> GetUpcomingBills(Guid organizationId, DateOnly? from = null, DateOnly? to = null);

    /// <summary>
    /// Retrieves aggregate values for upcoming payable bills in an organization.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <param name="from">Optional start date for due date filtering.</param>
    /// <param name="to">Optional end date for due date filtering.</param>
    /// <returns>The total amount and count of upcoming bills.</returns>
    Task<(decimal TotalAmount, int Count)> GetUpcomingBillsSummaryAsync(Guid organizationId, DateOnly? from = null, DateOnly? to = null);
}
