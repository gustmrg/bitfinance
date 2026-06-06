using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IBudgetsRepository : IRepository<Budget, Guid>
{
    Task<Budget?> GetByOrganizationIdAsync(Guid organizationId);
    Task<Budget> UpsertByOrganizationIdAsync(Guid organizationId, decimal amount);
}
