namespace BitFinance.API.Models;

public class RemoveMemberResult
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public RemoveMemberError? Error { get; init; }

    public static RemoveMemberResult Succeeded()
        => new() { Success = true };

    public static RemoveMemberResult Failed(RemoveMemberError error, string message)
        => new() { Success = false, Error = error, ErrorMessage = message };
}

public enum RemoveMemberError
{
    NotAuthorized,
    OrganizationNotFound,
    MemberNotFound,
    CannotRemoveLastOwner,
    CannotRemoveOwner,
}
