using BitFinance.API.Models;
using BitFinance.Business.Entities;
using BitFinance.Business.Results;

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

    /// <summary>
    /// Retrieves the total paid on bills due within a period.
    /// </summary>
    /// <param name="organizationId">The ID of the organization.</param>
    /// <param name="from">Optional start date for due date filtering.</param>
    /// <param name="to">Optional end date for due date filtering.</param>
    /// <returns>The sum of the paid amounts, falling back to the amount due when none was recorded.</returns>
    Task<decimal> GetPaidBillsTotalAsync(Guid organizationId, DateOnly? from = null, DateOnly? to = null);

    /// <summary>
    /// Creates a one-time bill, or a series when the data carries a frequency, within the organization's plan limit.
    /// For a series, returns its first occurrence.
    /// </summary>
    Task<Result<Bill>> CreateAsync(Guid organizationId, CreateBillData data);

    /// <summary>
    /// Returns one page of the organization's bills, with totals over every bill matching the query.
    /// </summary>
    Task<Result<BillPage>> GetPageAsync(Guid organizationId, BillListQuery query);

    Task<Result<Bill>> GetByIdAsync(Guid organizationId, Guid billId);

    Task<Result<Bill>> UpdateAsync(Guid organizationId, Guid billId, UpdateBillData data);

    /// <summary>
    /// Deletes a bill together with its documents.
    /// </summary>
    Task<Result> DeleteAsync(Guid organizationId, Guid billId);

    /// <summary>
    /// Returns the organization's bill series, each with its next open occurrence.
    /// </summary>
    Task<List<BillSeries>> GetSeriesAsync(Guid organizationId);

    /// <summary>
    /// Stops a series from generating occurrences and deletes its unpaid occurrences due after today.
    /// </summary>
    Task<Result> StopSeriesAsync(Guid organizationId, Guid seriesId);
}
