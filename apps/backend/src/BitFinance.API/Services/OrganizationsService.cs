using BitFinance.API.Models;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class OrganizationsService : IOrganizationsService
{
    private readonly IOrganizationsRepository _organizationsRepository;
    private readonly IBudgetsRepository _budgetsRepository;

    public OrganizationsService(
        IOrganizationsRepository organizationsRepository,
        IBudgetsRepository budgetsRepository)
    {
        _organizationsRepository = organizationsRepository;
        _budgetsRepository = budgetsRepository;
    }

    public async Task<List<Organization>> GetAllByUserIdAsync(string userId)
    {
        return await _organizationsRepository.GetAllByUserIdAsync(userId);
    }

    public async Task<Organization?> GetByIdAsync(Guid organizationId)
    {
        return await _organizationsRepository.GetByIdAsync(organizationId);
    }

    public async Task<Budget?> GetBudgetAsync(Guid organizationId)
    {
        return await _budgetsRepository.GetByOrganizationIdAsync(organizationId);
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

    public async Task<Budget> UpsertBudgetAsync(Guid organizationId, decimal amount)
    {
        return await _budgetsRepository.UpsertByOrganizationIdAsync(organizationId, amount);
    }

    public async Task<UpdateMemberRoleResult> UpdateMemberRoleAsync(
        Guid organizationId, string targetUserId, OrgRole newRole, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return UpdateMemberRoleResult.Failed(UpdateMemberRoleError.OrganizationNotFound, "Organization not found");

        var actingMember = organization.Members.FirstOrDefault(m => m.UserId == actingUserId);

        if (actingMember is null || actingMember.Role != OrgRole.Owner)
            return UpdateMemberRoleResult.Failed(UpdateMemberRoleError.NotAuthorized, "Only owners can update member roles");

        var targetMember = organization.Members.FirstOrDefault(m => m.UserId == targetUserId);

        if (targetMember is null)
            return UpdateMemberRoleResult.Failed(UpdateMemberRoleError.MemberNotFound, "Member not found");

        if (newRole == OrgRole.Owner)
            return UpdateMemberRoleResult.Failed(UpdateMemberRoleError.CannotPromoteToOwner, "Cannot promote a member to Owner");

        if (targetMember.Role == OrgRole.Owner)
        {
            if (targetMember.UserId == actingUserId)
            {
                var ownerCount = organization.Members.Count(m => m.Role == OrgRole.Owner);
                if (ownerCount <= 1)
                    return UpdateMemberRoleResult.Failed(UpdateMemberRoleError.CannotDemoteLastOwner, "Cannot demote the last owner");
            }
            else
            {
                return UpdateMemberRoleResult.Failed(UpdateMemberRoleError.CannotManageOwner, "Cannot change another owner's role");
            }
        }

        targetMember.Role = newRole;
        await _organizationsRepository.UpdateAsync(organization);
        return UpdateMemberRoleResult.Succeeded(targetMember);
    }

    public async Task<RemoveMemberResult> RemoveMemberAsync(
        Guid organizationId, string targetUserId, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return RemoveMemberResult.Failed(RemoveMemberError.OrganizationNotFound, "Organization not found");

        var targetMember = organization.Members.FirstOrDefault(m => m.UserId == targetUserId);

        if (targetMember is null)
            return RemoveMemberResult.Failed(RemoveMemberError.MemberNotFound, "Member not found");

        if (targetUserId == actingUserId)
        {
            if (targetMember.Role == OrgRole.Owner)
            {
                var ownerCount = organization.Members.Count(m => m.Role == OrgRole.Owner);
                if (ownerCount <= 1)
                    return RemoveMemberResult.Failed(RemoveMemberError.CannotRemoveLastOwner, "The last owner cannot leave the organization");
            }

            organization.Members.Remove(targetMember);
            await _organizationsRepository.UpdateAsync(organization);
            return RemoveMemberResult.Succeeded();
        }

        var actingMember = organization.Members.FirstOrDefault(m => m.UserId == actingUserId);

        if (actingMember is null)
            return RemoveMemberResult.Failed(RemoveMemberError.NotAuthorized, "You are not a member of this organization");

        if (actingMember.Role == OrgRole.Owner)
        {
            if (targetMember.Role == OrgRole.Owner)
                return RemoveMemberResult.Failed(RemoveMemberError.CannotRemoveOwner, "Cannot remove another owner");
        }
        else if (actingMember.Role == OrgRole.Admin)
        {
            if (targetMember.Role != OrgRole.Member)
                return RemoveMemberResult.Failed(RemoveMemberError.NotAuthorized, "Admins can only remove members");
        }
        else
        {
            return RemoveMemberResult.Failed(RemoveMemberError.NotAuthorized, "Only owners and admins can remove members");
        }

        organization.Members.Remove(targetMember);
        await _organizationsRepository.UpdateAsync(organization);
        return RemoveMemberResult.Succeeded();
    }
}
