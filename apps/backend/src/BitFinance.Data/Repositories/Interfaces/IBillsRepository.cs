using BitFinance.Business.Entities;
using BitFinance.Business.Enums;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IBillsRepository : IRepository<Bill, Guid>
{
    Task<(List<Bill> Items, int TotalCount)> GetAllByOrganizationAsync(Guid organizationId, int page, int pageSize,
        DateTime? startDate = null, DateTime? endDate = null,
        List<BillStatus>? statuses = null, string? description = null);
    Task<List<Bill>> GetAllByStatusAsync(BillStatus billStatus);
    Task<List<Bill>> GetAllByOrganizationAndStatusAsync(Guid organizationId, BillStatus billStatus);
    Task<List<Bill>> GetUpcomingBills(Guid organizationId, DateTime? startDate = null, DateTime? endDate = null);
    Task<(decimal TotalAmount, int Count)> GetUpcomingBillsSummaryAsync(Guid organizationId, DateTime? startDate = null,
        DateTime? endDate = null);
    Task UpdateRangeAsync(List<Bill> bills);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
    Task<int> GetOneTimeMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
    Task CreateRangeAsync(List<Bill> bills);
}
