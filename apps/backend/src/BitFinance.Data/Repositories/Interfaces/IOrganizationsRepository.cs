using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IOrganizationsRepository : IRepository<Organization, Guid>
{
    Task<List<Organization>> GetAllByUserIdAsync(string userId);

    /// <summary>
    /// Returns the organization's own settings (time zone, plan) for reading, without loading its budget and members.
    /// </summary>
    Task<Organization?> GetWithoutRelationsAsync(Guid id);
}