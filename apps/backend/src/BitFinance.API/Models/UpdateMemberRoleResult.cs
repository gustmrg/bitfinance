using BitFinance.Business.Entities;

namespace BitFinance.API.Models;

public class UpdateMemberRoleResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public UpdateMemberRoleError? Error { get; init; }
    public OrganizationMember? Member { get; init; }

    public static UpdateMemberRoleResult Succeeded(OrganizationMember member)
        => new() { Success = true, Member = member };

    public static UpdateMemberRoleResult Failed(UpdateMemberRoleError error, string message)
        => new() { Success = false, Error = error, ErrorMessage = message };
}

public enum UpdateMemberRoleError
{
    NotAuthorized,
    OrganizationNotFound,
    MemberNotFound,
    CannotManageOwner,
    CannotPromoteToOwner,
    CannotDemoteLastOwner,
}
