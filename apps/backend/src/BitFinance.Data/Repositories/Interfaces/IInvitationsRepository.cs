using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IInvitationsRepository : IRepository<Invitation, Guid>
{
    Task<Invitation?> GetByTokenHashAsync(string tokenHash);
    Task<List<Invitation>> GetPendingByOrganizationAsync(Guid organizationId, DateTime nowUtc);
}
