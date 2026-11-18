using System.Linq.Expressions;
using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IBillSeriesRepository : IRepository<BillSeries, Guid>
{
    Task<List<BillSeries>> GetAllActiveByOrganizationAsync(Guid organizationId);
    Task<List<BillSeries>> GetAllByOrganizationWithNextBillAsync(Guid organizationId);
    Task<int> GetMonthlyCountByOrganizationAsync(Guid organizationId, DateTime monthStartUtc, DateTime monthEndUtc);
    Task UpdateAsync(BillSeries series, params Expression<Func<BillSeries, object>>[] properties);

    /// <summary>
    /// Saves the generated occurrences and advances the series to <paramref name="nextOccurrenceNumber"/> in a single
    /// transaction. Returns <c>false</c>, saving nothing, when another writer already generated those occurrences.
    /// </summary>
    Task<bool> TryAddOccurrencesAsync(BillSeries series, List<Bill> bills, int nextOccurrenceNumber);
}
