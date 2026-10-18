using BitFinance.API.Models;
using BitFinance.Business.Entities;

namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Signs users in with Google and manages the Google login linked to a local account.
/// </summary>
public interface IGoogleAuthService
{
    /// <summary>
    /// Finds the user linked to the Google account, or creates one when no local account uses the email.
    /// </summary>
    /// <param name="identity">The identity returned by Google.</param>
    /// <returns>The signed-in user, or the reason the sign-in was refused.</returns>
    Task<GoogleAuthResult> SignInAsync(GoogleIdentity identity);

    /// <summary>
    /// Links a Google account to an existing local user.
    /// </summary>
    /// <param name="userId">The local user's ID.</param>
    /// <param name="identity">The identity returned by Google.</param>
    /// <returns>The linked user, or the reason the link was refused.</returns>
    Task<GoogleAuthResult> LinkAsync(string userId, GoogleIdentity identity);

    /// <summary>
    /// Removes the Google login from a user that can still sign in with a password.
    /// </summary>
    /// <param name="userId">The local user's ID.</param>
    /// <returns>The user, or the reason the unlink was refused.</returns>
    Task<GoogleAuthResult> UnlinkAsync(string userId);

    /// <summary>
    /// Checks whether the user has a Google login linked.
    /// </summary>
    /// <param name="user">The local user.</param>
    /// <returns><c>true</c> if a Google login is linked; otherwise, <c>false</c>.</returns>
    Task<bool> HasGoogleLoginAsync(User user);
}
