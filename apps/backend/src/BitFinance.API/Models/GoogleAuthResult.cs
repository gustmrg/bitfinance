using BitFinance.Business.Entities;

namespace BitFinance.API.Models;

public class GoogleAuthResult
{
    public bool Success { get; init; }
    public GoogleAuthError? Error { get; init; }
    public User? User { get; init; }

    public static GoogleAuthResult Succeeded(User user)
        => new() { Success = true, User = user };

    public static GoogleAuthResult Failed(GoogleAuthError error)
        => new() { Success = false, Error = error };
}

public enum GoogleAuthError
{
    EmailNotVerified,
    EmailInUse,
    LockedOut,
    UserNotFound,
    AlreadyLinked,
    LinkedToAnotherAccount,
    NotLinked,
    PasswordRequired,
    IdentityFailure,
}
