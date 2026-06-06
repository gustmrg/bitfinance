using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class BillsService : IBillsService
{
    private readonly IBillsRepository _billsRepository;

    public BillsService(IBillsRepository billsRepository)
    {
        _billsRepository = billsRepository;
    }
    
    public async Task<List<Bill>> GetUpcomingBills(Guid organizationId, DateTime? from = null, DateTime? to = null)
    {
        return await _billsRepository.GetUpcomingBills(organizationId, from, to);
    }

    public async Task<(decimal TotalAmount, int Count)> GetUpcomingBillsSummaryAsync(
        Guid organizationId,
        DateTime? from = null,
        DateTime? to = null)
    {
        return await _billsRepository.GetUpcomingBillsSummaryAsync(organizationId, from, to);
    }
}
