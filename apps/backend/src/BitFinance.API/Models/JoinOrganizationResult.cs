using BitFinance.Business.Entities;

namespace BitFinance.API.Models;

public class JoinOrganizationResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public JoinOrganizationError? Error { get; init; }
    public Organization? Organization { get; init; }

    public static JoinOrganizationResult Succeeded(Organization organization)
        => new() { Success = true, Organization = organization };

    public static JoinOrganizationResult Failed(JoinOrganizationError error, string message)
        => new() { Success = false, Error = error, ErrorMessage = message };
}

public enum JoinOrganizationError
{
    InvalidToken,
    InvitationNotPending,
    InvitationExpired,
    OrganizationNotFound,
    AlreadyMember,
    EmailMismatch,
}
