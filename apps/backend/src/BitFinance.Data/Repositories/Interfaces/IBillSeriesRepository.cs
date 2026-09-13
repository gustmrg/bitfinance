using System.Linq.Expressions;
using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IBillSeriesRepository : IRepository<BillSeries, Guid>
{
    Task<List<BillSeries>> GetAllActiveAsync();
    Task<List<BillSeries>> GetAllActiveByOrganizationAsync(Guid organizationId);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
    Task UpdateAsync(BillSeries series, params Expression<Func<BillSeries, object>>[] properties);
}
