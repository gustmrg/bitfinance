using BitFinance.API.Models;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using Microsoft.AspNetCore.Identity;

namespace BitFinance.API.Services;

public class GoogleAuthService : IGoogleAuthService
{
    public const string LoginProvider = "Google";

    private readonly UserManager<User> _userManager;
    private readonly ILogger<GoogleAuthService> _logger;

    public GoogleAuthService(UserManager<User> userManager, ILogger<GoogleAuthService> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<GoogleAuthResult> SignInAsync(GoogleIdentity identity)
    {
        var user = await _userManager.FindByLoginAsync(LoginProvider, identity.Subject);

        if (user is null)
        {
            if (!identity.EmailVerified)
                return GoogleAuthResult.Failed(GoogleAuthError.EmailNotVerified);

            // Linking by email would let whoever registered the address with a password keep access,
            // since local registration does not confirm emails. Existing accounts link from their profile.
            if (await _userManager.FindByEmailAsync(identity.Email) is not null)
                return GoogleAuthResult.Failed(GoogleAuthError.EmailInUse);

            user = new User
            {
                UserName = identity.Email,
                Email = identity.Email,
                EmailConfirmed = true,
                FirstName = identity.FirstName,
                LastName = identity.LastName
            };

            var created = await _userManager.CreateAsync(user);
            if (!created.Succeeded)
            {
                _logger.LogWarning("Could not create user from Google login: {Errors}", Describe(created));
                return GoogleAuthResult.Failed(GoogleAuthError.IdentityFailure);
            }

            var linked = await _userManager.AddLoginAsync(user, CreateLoginInfo(identity));
            if (!linked.Succeeded)
            {
                _logger.LogWarning("Could not link Google login to new user {UserId}: {Errors}", user.Id, Describe(linked));
                await _userManager.DeleteAsync(user);
                return GoogleAuthResult.Failed(GoogleAuthError.IdentityFailure);
            }

            _logger.LogInformation("User created a new account with Google: {Email}", identity.Email);
        }

        if (await _userManager.IsLockedOutAsync(user))
            return GoogleAuthResult.Failed(GoogleAuthError.LockedOut);

        return GoogleAuthResult.Succeeded(user);
    }

    public async Task<GoogleAuthResult> LinkAsync(string userId, GoogleIdentity identity)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return GoogleAuthResult.Failed(GoogleAuthError.UserNotFound);

        var owner = await _userManager.FindByLoginAsync(LoginProvider, identity.Subject);

        if (owner is not null)
        {
            return owner.Id == user.Id
                ? GoogleAuthResult.Succeeded(user)
                : GoogleAuthResult.Failed(GoogleAuthError.LinkedToAnotherAccount);
        }

        if (await HasGoogleLoginAsync(user))
            return GoogleAuthResult.Failed(GoogleAuthError.AlreadyLinked);

        var linked = await _userManager.AddLoginAsync(user, CreateLoginInfo(identity));
        if (!linked.Succeeded)
        {
            _logger.LogWarning("Could not link Google login to user {UserId}: {Errors}", user.Id, Describe(linked));
            return GoogleAuthResult.Failed(GoogleAuthError.IdentityFailure);
        }

        _logger.LogInformation("User {UserId} linked a Google login", user.Id);

        return GoogleAuthResult.Succeeded(user);
    }

    public async Task<GoogleAuthResult> UnlinkAsync(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return GoogleAuthResult.Failed(GoogleAuthError.UserNotFound);

        var login = (await _userManager.GetLoginsAsync(user))
            .FirstOrDefault(l => l.LoginProvider == LoginProvider);

        if (login is null)
            return GoogleAuthResult.Failed(GoogleAuthError.NotLinked);

        if (!await _userManager.HasPasswordAsync(user))
            return GoogleAuthResult.Failed(GoogleAuthError.PasswordRequired);

        var removed = await _userManager.RemoveLoginAsync(user, login.LoginProvider, login.ProviderKey);
        if (!removed.Succeeded)
        {
            _logger.LogWarning("Could not unlink Google login from user {UserId}: {Errors}", user.Id, Describe(removed));
            return GoogleAuthResult.Failed(GoogleAuthError.IdentityFailure);
        }

        _logger.LogInformation("User {UserId} unlinked their Google login", user.Id);

        return GoogleAuthResult.Succeeded(user);
    }

    public async Task<bool> HasGoogleLoginAsync(User user)
    {
        return (await _userManager.GetLoginsAsync(user)).Any(l => l.LoginProvider == LoginProvider);
    }

    private static UserLoginInfo CreateLoginInfo(GoogleIdentity identity)
        => new(LoginProvider, identity.Subject, LoginProvider);

    private static string Describe(IdentityResult result)
        => string.Join(", ", result.Errors.Select(e => e.Code));
}
