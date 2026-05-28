using BitFinance.Business.Entities;

namespace BitFinance.API.Models;

public class CreateInvitationResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public CreateInvitationError? Error { get; init; }
    public Invitation? Invitation { get; init; }

    /// <summary>
    /// The raw (unhashed) token, only available on creation. Never persisted.
    /// </summary>
    public string? RawToken { get; init; }

    public static CreateInvitationResult Succeeded(Invitation invitation, string rawToken)
        => new() { Success = true, Invitation = invitation, RawToken = rawToken };

    public static CreateInvitationResult Failed(CreateInvitationError error, string message)
        => new() { Success = false, Error = error, ErrorMessage = message };
}

public enum CreateInvitationError
{
    NotAuthorized,
    InvalidRole,
    OrganizationNotFound,
    PlanLimitReached,
}
