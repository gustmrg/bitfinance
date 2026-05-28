using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class OrganizationsService : IOrganizationsService
{
    private readonly IOrganizationsRepository _organizationsRepository;

    public OrganizationsService(IOrganizationsRepository organizationsRepository)
    {
        _organizationsRepository = organizationsRepository;
    }

    public async Task<List<Organization>> GetAllByUserIdAsync(string userId)
    {
        return await _organizationsRepository.GetAllByUserIdAsync(userId);
    }

    public async Task<Organization?> GetByIdAsync(Guid organizationId)
    {
        return await _organizationsRepository.GetByIdAsync(organizationId);
    }

    public async Task<Organization> CreateAsync(string name, string ownerUserId)
    {
        var organization = new Organization
        {
            Id = Guid.CreateVersion7(),
            Name = name,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = null,
        };

        organization.Members.Add(new OrganizationMember
        {
            UserId = ownerUserId,
            OrganizationId = organization.Id,
            Role = OrgRole.Owner,
            JoinedAt = DateTime.UtcNow,
        });

        await _organizationsRepository.CreateAsync(organization);
        return organization;
    }

    public async Task<Organization?> UpdateAsync(Guid organizationId, string name)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null) return null;

        organization.Name = name;
        organization.UpdatedAt = DateTime.UtcNow;

        await _organizationsRepository.UpdateAsync(organization);
        return organization;
    }
}
