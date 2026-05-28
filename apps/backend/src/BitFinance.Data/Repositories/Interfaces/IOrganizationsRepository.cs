using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IOrganizationsRepository : IRepository<Organization, Guid>
{
    Task<List<Organization>> GetAllByUserIdAsync(string userId);
}