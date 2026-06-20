using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IBillSeriesRepository : IRepository<BillSeries, Guid>
{
    Task<List<BillSeries>> GetAllActiveAsync();
    Task<List<BillSeries>> GetAllActiveByOrganizationAsync(Guid organizationId);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
}
