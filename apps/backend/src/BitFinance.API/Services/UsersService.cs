using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class UsersService : IUsersService
{
    private readonly IUsersRepository _usersRepository;

    public UsersService(IUsersRepository usersRepository)
    {
        _usersRepository = usersRepository;
    }

    public async Task<bool> IsUserInOrganizationAsync(string userId, Guid organizationId)
    {
        var user = await _usersRepository.GetByIdAsync(userId);

        if (user == null) return false;
        
        return user.OrganizationMemberships.Any(m => m.OrganizationId == organizationId);
    }

    public async Task<User?> GetUserByIdAsync(string userId)
    {
        return await _usersRepository.GetByIdAsync(userId);
    }

    public async Task UpdateUserAsync(User user)
    {
        await _usersRepository.UpdateAsync(user);
    }
}