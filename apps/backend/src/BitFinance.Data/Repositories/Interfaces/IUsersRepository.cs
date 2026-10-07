using BitFinance.Business.Entities;

namespace BitFinance.Data.Repositories.Interfaces;

public interface IUsersRepository
{
    Task<User?> GetByIdAsync(string id);
    Task UpdateAsync(User entity);
}
