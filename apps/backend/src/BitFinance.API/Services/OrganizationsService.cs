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
    private readonly IAttachmentsRepository _attachmentsRepository;
    private readonly IFileStorageService _storageService;
    private readonly INotificationService _notificationService;
    private readonly ITransactionRunner _transactionRunner;
    private readonly ILogger<OrganizationsService> _logger;

    public OrganizationsService(
        IOrganizationsRepository organizationsRepository,
        IBudgetsRepository budgetsRepository,
        IAttachmentsRepository attachmentsRepository,
        IFileStorageService storageService,
        INotificationService notificationService,
        ITransactionRunner transactionRunner,
        ILogger<OrganizationsService> logger)
    {
        _organizationsRepository = organizationsRepository;
        _budgetsRepository = budgetsRepository;
        _attachmentsRepository = attachmentsRepository;
        _storageService = storageService;
        _notificationService = notificationService;
        _transactionRunner = transactionRunner;
        _logger = logger;
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

    public async Task<OrganizationActionResult<Organization>> UpdateAsync(
        Guid organizationId, string name, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return OrganizationActionResult<Organization>.Failed(OrganizationActionError.OrganizationNotFound, "Organization not found");

        if (!CanManageSettings(organization, actingUserId))
            return OrganizationActionResult<Organization>.Failed(OrganizationActionError.NotAuthorized, "Only owners and admins can update the organization");

        organization.Name = name;
        organization.UpdatedAt = DateTime.UtcNow;

        await _organizationsRepository.UpdateAsync(organization);
        return OrganizationActionResult<Organization>.Succeeded(organization);
    }

    public async Task<OrganizationActionResult<Budget>> UpsertBudgetAsync(
        Guid organizationId, decimal amount, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return OrganizationActionResult<Budget>.Failed(OrganizationActionError.OrganizationNotFound, "Organization not found");

        if (!CanManageSettings(organization, actingUserId))
            return OrganizationActionResult<Budget>.Failed(OrganizationActionError.NotAuthorized, "Only owners and admins can update the budget");

        var budget = await _budgetsRepository.UpsertByOrganizationIdAsync(organizationId, amount);
        return OrganizationActionResult<Budget>.Succeeded(budget);
    }

    public async Task<OrganizationActionResult<OrganizationMember>> TransferOwnershipAsync(
        Guid organizationId, string targetUserId, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return OrganizationActionResult<OrganizationMember>.Failed(OrganizationActionError.OrganizationNotFound, "Organization not found");

        var actingMember = organization.Members.FirstOrDefault(m => m.UserId == actingUserId);

        if (actingMember is null || actingMember.Role != OrgRole.Owner)
            return OrganizationActionResult<OrganizationMember>.Failed(OrganizationActionError.NotAuthorized, "Only owners can transfer ownership");

        if (targetUserId == actingUserId)
            return OrganizationActionResult<OrganizationMember>.Failed(OrganizationActionError.InvalidTarget, "You already own this organization");

        var targetMember = organization.Members.FirstOrDefault(m => m.UserId == targetUserId);

        if (targetMember is null)
            return OrganizationActionResult<OrganizationMember>.Failed(OrganizationActionError.MemberNotFound, "Member not found");

        if (targetMember.Role == OrgRole.Owner)
            return OrganizationActionResult<OrganizationMember>.Failed(OrganizationActionError.InvalidTarget, "This member is already an owner");

        var previousRole = targetMember.Role;
        var eventId = Guid.CreateVersion7();
        await _transactionRunner.ExecuteAsync(async () =>
        {
            targetMember.Role = OrgRole.Owner;
            actingMember.Role = OrgRole.Admin;
            await _organizationsRepository.UpdateAsync(organization);
            await _notificationService.EnqueueAsync(
                organizationId,
                NotificationType.MemberRoleChanged,
                targetUserId,
                $"membership:role:{eventId:N}",
                new NotificationEventPayload(
                    MemberUserId: targetUserId,
                    MemberName: targetMember.User?.FullName ?? targetMember.User?.UserName ?? targetUserId,
                    ActorName: actingMember.User?.FullName ?? actingMember.User?.UserName ?? actingUserId,
                    PreviousRole: previousRole.ToString(),
                    NewRole: OrgRole.Owner.ToString()));
        });
        return OrganizationActionResult<OrganizationMember>.Succeeded(targetMember);
    }

    public async Task<OrganizationActionResult<Organization>> DeleteAsync(Guid organizationId, string actingUserId)
    {
        var organization = await _organizationsRepository.GetByIdAsync(organizationId);

        if (organization is null)
            return OrganizationActionResult<Organization>.Failed(OrganizationActionError.OrganizationNotFound, "Organization not found");

        var actingMember = organization.Members.FirstOrDefault(m => m.UserId == actingUserId);

        if (actingMember is null || actingMember.Role != OrgRole.Owner)
            return OrganizationActionResult<Organization>.Failed(OrganizationActionError.NotAuthorized, "Only owners can delete the organization");

        var storagePaths = await _attachmentsRepository.GetStoragePathsByOrganizationAsync(organizationId);

        await _organizationsRepository.DeleteAsync(organization);

        foreach (var storagePath in storagePaths)
        {
            if (!await _storageService.DeleteFileAsync(storagePath))
                _logger.LogWarning("Unable to delete storage object {StoragePath} of deleted organization {OrganizationId}", storagePath, organizationId);
        }

        return OrganizationActionResult<Organization>.Succeeded(organization);
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

        var previousRole = targetMember.Role;
        var eventId = Guid.CreateVersion7();
        await _transactionRunner.ExecuteAsync(async () =>
        {
            targetMember.Role = newRole;
            await _organizationsRepository.UpdateAsync(organization);
            await _notificationService.EnqueueAsync(
                organizationId,
                NotificationType.MemberRoleChanged,
                targetUserId,
                $"membership:role:{eventId:N}",
                new NotificationEventPayload(
                    MemberUserId: targetUserId,
                    MemberName: targetMember.User?.FullName ?? targetMember.User?.UserName ?? targetUserId,
                    ActorName: actingMember.User?.FullName ?? actingMember.User?.UserName ?? actingUserId,
                    PreviousRole: previousRole.ToString(),
                    NewRole: newRole.ToString()));
        });
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

            await RemoveMemberAndNotifyAsync(organization, targetMember, actingMember: targetMember);
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

        await RemoveMemberAndNotifyAsync(organization, targetMember, actingMember);
        return RemoveMemberResult.Succeeded();
    }

    private static bool CanManageSettings(Organization organization, string actingUserId)
    {
        var role = organization.Members.FirstOrDefault(m => m.UserId == actingUserId)?.Role;
        return role is OrgRole.Owner or OrgRole.Admin;
    }

    private async Task RemoveMemberAndNotifyAsync(
        Organization organization,
        OrganizationMember targetMember,
        OrganizationMember actingMember)
    {
        var eventId = Guid.CreateVersion7();
        var memberName = targetMember.User?.FullName ?? targetMember.User?.UserName ?? targetMember.UserId;
        var actorName = actingMember.User?.FullName ?? actingMember.User?.UserName ?? actingMember.UserId;
        await _transactionRunner.ExecuteAsync(async () =>
        {
            organization.Members.Remove(targetMember);
            await _organizationsRepository.UpdateAsync(organization);
            await _notificationService.EnqueueAsync(
                organization.Id,
                NotificationType.MemberRemoved,
                targetMember.UserId,
                $"membership:removed:{eventId:N}",
                new NotificationEventPayload(
                    MemberUserId: targetMember.UserId,
                    MemberName: memberName,
                    ActorName: actorName));
        });
    }
}
