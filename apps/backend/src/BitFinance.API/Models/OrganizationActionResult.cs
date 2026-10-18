namespace BitFinance.API.Models;

public class OrganizationActionResult<T>
{
    public bool Success { get; init; }
    public string? ErrorMessage { get; init; }
    public OrganizationActionError? Error { get; init; }
    public T? Value { get; init; }

    public static OrganizationActionResult<T> Succeeded(T value)
        => new() { Success = true, Value = value };

    public static OrganizationActionResult<T> Failed(OrganizationActionError error, string message)
        => new() { Success = false, Error = error, ErrorMessage = message };
}

public enum OrganizationActionError
{
    NotAuthorized,
    OrganizationNotFound,
    MemberNotFound,
    InvitationNotFound,
    InvalidTarget,
}
