using System.Linq.Expressions;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IBillsRepository : IRepository<Bill, Guid>
{
    /// <summary>
    /// Returns the bill only when it belongs to the given organization.
    /// </summary>
    Task<Bill?> GetByIdAsync(Guid id, Guid organizationId);
    Task<(List<Bill> Items, int TotalCount, BillListSummary Summary)> GetAllByOrganizationAsync(
        Guid organizationId, int page, int pageSize, DateOnly today,
        DateOnly? startDate = null, DateOnly? endDate = null,
        List<BillStatus>? statuses = null, string? description = null, BillTypeFilter? type = null);
    Task<List<Bill>> GetAllByStatusAsync(BillStatus billStatus);
    Task<List<Bill>> GetAllByOrganizationAndStatusAsync(Guid organizationId, BillStatus billStatus);
    Task<List<Bill>> GetUpcomingBills(Guid organizationId, DateOnly? startDate = null, DateOnly? endDate = null);
    Task<(decimal TotalAmount, int Count)> GetUpcomingBillsSummaryAsync(Guid organizationId, DateOnly? startDate = null,
        DateOnly? endDate = null);
    Task<decimal> GetPaidBillsTotalAsync(Guid organizationId, DateOnly? startDate = null, DateOnly? endDate = null);
    Task UpdateAsync(Bill bill, params Expression<Func<Bill, object>>[] properties);
    Task UpdateRangeAsync(List<Bill> bills);
    Task RemoveSeriesBillsFromCacheAsync(Guid seriesId);
    Task<List<Bill>> GetForReportAsync(Guid organizationId, DateOnly startDate, DateOnly endDate);
    Task<List<Bill>> GetUnpaidSeriesBillsDueAfterAsync(Guid seriesId, DateOnly date);
    Task DeleteRangeAsync(List<Bill> bills);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
    Task<int> GetOneTimeMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
}
