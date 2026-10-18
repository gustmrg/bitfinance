using System.Security.Claims;
using Asp.Versioning;
using BitFinance.API.Models;
using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Business.Interfaces;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

namespace BitFinance.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/identity/external")]
public class ExternalIdentityController : ControllerBase
{
    public const string LinkUserIdKey = "linkUserId";
    private const string ReturnToKey = "returnTo";
    private const string CallbackPath = "/api/v1/identity/external/google/callback";
    private const string SignInPath = "/auth/sign-in";
    private const string AccountSettingsPath = "/account/settings";

    private readonly IGoogleAuthService _googleAuthService;
    private readonly SignInManager<User> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ICookieService _cookieService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly GoogleAuthSettings _googleSettings;
    private readonly ILogger<ExternalIdentityController> _logger;

    public ExternalIdentityController(
        IGoogleAuthService googleAuthService,
        SignInManager<User> signInManager,
        ITokenService tokenService,
        ICookieService cookieService,
        IRefreshTokenRepository refreshTokenRepository,
        IOptions<GoogleAuthSettings> googleSettings,
        ILogger<ExternalIdentityController> logger)
    {
        _googleAuthService = googleAuthService;
        _signInManager = signInManager;
        _tokenService = tokenService;
        _cookieService = cookieService;
        _refreshTokenRepository = refreshTokenRepository;
        _googleSettings = googleSettings.Value;
        _logger = logger;
    }

    [HttpGet("providers")]
    [EndpointSummary("List external login providers")]
    [EndpointDescription("Returns the external identity providers enabled on this server.")]
    public IActionResult GetProviders()
    {
        return Ok(new { Providers = _googleSettings.Enabled ? new[] { "google" } : [] });
    }

    [HttpGet("google")]
    [EndpointSummary("Sign in with Google")]
    [EndpointDescription("Redirects the browser to Google. After consent, the user is signed in with a refresh token cookie and sent back to returnTo.")]
    public IActionResult SignInWithGoogle([FromQuery] string? returnTo)
    {
        if (!_googleSettings.Enabled)
            return NotFound();

        var properties = _signInManager.ConfigureExternalAuthenticationProperties(GoogleAuthService.LoginProvider, CallbackPath);
        properties.Items[ReturnToKey] = SafeReturnTo(returnTo, "/dashboard");

        return Challenge(properties, GoogleAuthService.LoginProvider);
    }

    [HttpGet("google/link")]
    [EndpointSummary("Link a Google account")]
    [EndpointDescription("Redirects the browser to Google to link a Google account to the user identified by the refresh token cookie.")]
    public async Task<IActionResult> LinkGoogleAsync([FromQuery] string? returnTo)
    {
        if (!_googleSettings.Enabled)
            return NotFound();

        var target = SafeReturnTo(returnTo, AccountSettingsPath);
        var refreshToken = _cookieService.GetRefreshTokenFromCookie(Request);
        var storedToken = string.IsNullOrEmpty(refreshToken)
            ? null
            : await _tokenService.ValidateRefreshTokenAsync(refreshToken);

        if (storedToken is null)
            return Redirect(FrontendUrl($"{SignInPath}?returnTo={Uri.EscapeDataString(target)}"));

        var properties = _signInManager.ConfigureExternalAuthenticationProperties(GoogleAuthService.LoginProvider, CallbackPath);
        properties.Items[ReturnToKey] = target;
        properties.Items[LinkUserIdKey] = storedToken.UserId;

        return Challenge(properties, GoogleAuthService.LoginProvider);
    }

    [HttpGet("google/callback")]
    [ApiExplorerSettings(IgnoreApi = true)]
    public async Task<IActionResult> GoogleCallbackAsync()
    {
        if (!_googleSettings.Enabled)
            return NotFound();

        var info = await _signInManager.GetExternalLoginInfoAsync();
        await HttpContext.SignOutAsync(IdentityConstants.ExternalScheme);

        var returnTo = SafeReturnTo(info?.AuthenticationProperties?.GetString(ReturnToKey), "/dashboard");
        var linkUserId = info?.AuthenticationProperties?.GetString(LinkUserIdKey);
        var identity = info is null ? null : GoogleIdentity.FromPrincipal(info.Principal);

        if (identity is null)
        {
            _logger.LogWarning("Google callback without a usable external login");
            return Redirect(FrontendUrl(WithQuery(linkUserId is null ? SignInPath : returnTo, "googleError", "failed")));
        }

        if (linkUserId is not null)
        {
            var linkResult = await _googleAuthService.LinkAsync(linkUserId, identity);

            return Redirect(FrontendUrl(linkResult.Success
                ? WithQuery(returnTo, "google", "linked")
                : WithQuery(returnTo, "googleError", ErrorCode(linkResult.Error))));
        }

        var result = await _googleAuthService.SignInAsync(identity);

        if (!result.Success)
            return Redirect(FrontendUrl(WithQuery(SignInPath, "googleError", ErrorCode(result.Error))));

        var (rawRefreshToken, refreshTokenEntity) = _tokenService.GenerateRefreshToken(
            result.User!,
            ipAddress: HttpContext.Connection.RemoteIpAddress?.ToString(),
            userAgent: Request.Headers.UserAgent.FirstOrDefault());

        await _refreshTokenRepository.CreateAsync(refreshTokenEntity);

        _cookieService.SetRefreshTokenCookie(Response, rawRefreshToken, refreshTokenEntity.ExpiresAt);

        _logger.LogInformation("User logged in with Google: {UserId}", result.User!.Id);

        return Redirect(FrontendUrl(returnTo));
    }

    [Authorize]
    [HttpDelete("google")]
    [EndpointSummary("Unlink the Google account")]
    [EndpointDescription("Removes the Google login from the authenticated user. Requires the account to have a password.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnlinkGoogleAsync()
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User is not authenticated.");

        var result = await _googleAuthService.UnlinkAsync(userId);

        return result.Error switch
        {
            null => NoContent(),
            GoogleAuthError.NotLinked or GoogleAuthError.UserNotFound => NotFound(),
            GoogleAuthError.PasswordRequired => BadRequest(new { message = "Set a password before unlinking Google." }),
            _ => BadRequest(new { message = "Unable to unlink the Google account." })
        };
    }

    public static string SafeReturnTo(string? value, string fallback)
    {
        return !string.IsNullOrEmpty(value)
               && value.StartsWith('/')
               && !value.StartsWith("//")
               && !value.Contains('\\')
            ? value
            : fallback;
    }

    private static string WithQuery(string path, string key, string value)
    {
        var separator = path.Contains('?') ? '&' : '?';
        return $"{path}{separator}{key}={Uri.EscapeDataString(value)}";
    }

    private static string ErrorCode(GoogleAuthError? error) => error switch
    {
        GoogleAuthError.EmailNotVerified => "email-not-verified",
        GoogleAuthError.EmailInUse => "email-in-use",
        GoogleAuthError.LockedOut => "locked-out",
        GoogleAuthError.AlreadyLinked => "already-linked",
        GoogleAuthError.LinkedToAnotherAccount => "linked-to-another-account",
        _ => "failed"
    };

    private string FrontendUrl(string path) => $"{_googleSettings.FrontendBaseUrl.TrimEnd('/')}{path}";
}
