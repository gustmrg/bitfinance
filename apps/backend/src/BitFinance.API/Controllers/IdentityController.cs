using System.Security.Claims;
using Asp.Versioning;
using BitFinance.API.InputModels;
using BitFinance.API.Models.Request;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.ViewModels;
using BitFinance.Business.Entities;
using BitFinance.Business.Interfaces;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/identity")]
public class IdentityController : ControllerBase
{
    private readonly IUsersService _usersService;
    private readonly UserManager<User> _userManager;
    private readonly SignInManager<User> _signInManager;
    private readonly ITokenService _tokenService;
    private readonly ICookieService _cookieService;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly IAttachmentService _attachmentService;
    private readonly ILogger<IdentityController> _logger;

    private const int AccessTokenExpirationMinutes = 60;

    public IdentityController(
        IUsersService usersService,
        UserManager<User> userManager,
        SignInManager<User> signInManager,
        ILogger<IdentityController> logger,
        ITokenService tokenService,
        ICookieService cookieService,
        IRefreshTokenRepository refreshTokenRepository,
        IAttachmentService attachmentService)
    {
        _usersService = usersService;
        _userManager = userManager;
        _signInManager = signInManager;
        _logger = logger;
        _tokenService = tokenService;
        _cookieService = cookieService;
        _refreshTokenRepository = refreshTokenRepository;
        _attachmentService = attachmentService;
    }

    [HttpPost("register")]
    [EndpointSummary("Register a new user")]
    [EndpointDescription("Creates a new user account with email and password. Returns an access token and sets a refresh token cookie.")]
    public async Task<IActionResult> RegisterAsync([FromBody] RegisterInputModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new User
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (result.Succeeded)
        {
            _logger.LogInformation("User created a new account: {Email}", model.Email);

            // JWT-only auth: don't issue ASP.NET Identity auth cookie.

            var accessToken = _tokenService.GenerateAccessToken(user);
            var (rawRefreshToken, refreshTokenEntity) = _tokenService.GenerateRefreshToken(
                user,
                ipAddress: GetClientIpAddress(),
                userAgent: GetUserAgent());

            await _refreshTokenRepository.CreateAsync(refreshTokenEntity);

            _cookieService.SetRefreshTokenCookie(Response, rawRefreshToken, refreshTokenEntity.ExpiresAt);

            return Ok(new AuthenticationResponse(
                accessToken,
                DateTime.UtcNow.AddMinutes(AccessTokenExpirationMinutes),
                new UserInfo(user.Id, user.Email!, user.UserName!, user.FirstName, user.LastName)
            ));
        }

        return BadRequest(new { Errors = result.Errors });
    }

    [HttpPost("login")]
    [EndpointSummary("Log in")]
    [EndpointDescription("Authenticates a user with email and password. Returns an access token and sets a refresh token cookie.")]
    public async Task<IActionResult> LogInAsync([FromBody] LoginInputModel model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);

        if (user == null)
            return Unauthorized(new { message = "Invalid email or password" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, lockoutOnFailure: true);

        if (result.Succeeded)
        {
            _logger.LogInformation("User logged in: {Email}", model.Email);

            var accessToken = _tokenService.GenerateAccessToken(user);
            var (rawRefreshToken, refreshTokenEntity) = _tokenService.GenerateRefreshToken(
                user,
                ipAddress: GetClientIpAddress(),
                userAgent: GetUserAgent());

            await _refreshTokenRepository.CreateAsync(refreshTokenEntity);

            _cookieService.SetRefreshTokenCookie(Response, rawRefreshToken, refreshTokenEntity.ExpiresAt);

            return Ok(new AuthenticationResponse(
                accessToken,
                DateTime.UtcNow.AddMinutes(AccessTokenExpirationMinutes),
                new UserInfo(user.Id, user.Email!, user.UserName!, user.FirstName, user.LastName)
            ));
        }

        if (result.IsLockedOut)
        {
            _logger.LogWarning("User account locked out: {Email}", model.Email);
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "Account locked out" });
        }

        return Unauthorized(new { message = "Invalid email or password" });
    }

    [HttpPost("refresh")]
    [EndpointSummary("Refresh access token")]
    [EndpointDescription("Uses the refresh token from the HTTP-only cookie to issue a new access token and rotate the refresh token.")]
    public async Task<IActionResult> RefreshTokenAsync()
    {
        var refreshToken = _cookieService.GetRefreshTokenFromCookie(Request);

        if (string.IsNullOrEmpty(refreshToken))
        {
            return Unauthorized(new { message = "Refresh token not found" });
        }

        var storedToken = await _tokenService.ValidateRefreshTokenAsync(refreshToken);

        if (storedToken == null)
        {
            _cookieService.RemoveRefreshTokenCookie(Response);
            return Unauthorized(new { message = "Invalid or expired refresh token" });
        }

        var rotationResult = await _tokenService.RotateRefreshTokenAsync(
            storedToken,
            GetClientIpAddress(),
            GetUserAgent());

        if (rotationResult == null)
        {
            _cookieService.RemoveRefreshTokenCookie(Response);
            _logger.LogWarning("Token reuse detected for user {UserId}", storedToken.UserId);
            return Unauthorized(new { message = "Session compromised. Please log in again." });
        }

        var (accessToken, newRefreshToken, newRefreshTokenEntity) = rotationResult.Value;

        _cookieService.SetRefreshTokenCookie(Response, newRefreshToken, newRefreshTokenEntity.ExpiresAt);

        _logger.LogInformation("Token refreshed for user {UserId}", storedToken.UserId);

        return Ok(new AuthenticationResponse(
            accessToken,
            DateTime.UtcNow.AddMinutes(AccessTokenExpirationMinutes),
            new UserInfo(
                storedToken.User.Id,
                storedToken.User.Email!,
                storedToken.User.UserName!,
                storedToken.User.FirstName,
                storedToken.User.LastName)
        ));
    }

    [Authorize]
    [HttpPost("logout")]
    [EndpointSummary("Log out")]
    [EndpointDescription("Revokes the current refresh token family and clears the refresh token cookie.")]
    public async Task<IActionResult> LogoutAsync()
    {
        var refreshToken = _cookieService.GetRefreshTokenFromCookie(Request);

        if (!string.IsNullOrEmpty(refreshToken))
        {
            var storedToken = await _tokenService.ValidateRefreshTokenAsync(refreshToken);
            if (storedToken != null)
            {
                await _refreshTokenRepository.RevokeTokenFamilyAsync(
                    storedToken.TokenFamilyId,
                    "User logout");
            }
        }

        _cookieService.RemoveRefreshTokenCookie(Response);

        await _signInManager.SignOutAsync();

        _logger.LogInformation("User logged out");

        return Ok(new { message = "Logged out successfully" });
    }

    [Authorize]
    [HttpPost("logout-all")]
    [EndpointSummary("Log out from all devices")]
    [EndpointDescription("Revokes all refresh tokens for the authenticated user and clears the cookie.")]
    public async Task<IActionResult> LogoutAllDevicesAsync()
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return BadRequest("Invalid user");

        await _refreshTokenRepository.RevokeAllUserTokensAsync(userId, "User logged out all devices");

        _cookieService.RemoveRefreshTokenCookie(Response);

        await _signInManager.SignOutAsync();

        _logger.LogInformation("User {UserId} logged out from all devices", userId);

        return Ok(new { message = "Logged out from all devices successfully" });
    }

    [Authorize]
    [HttpGet("me")]
    [EndpointSummary("Get current user profile")]
    [EndpointDescription("Returns the authenticated user's profile information and organizations.")]
    public async Task<IActionResult> GetMe()
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return BadRequest("Invalid user");

        var user = await _usersService.GetUserByIdAsync(userId);

        if (user == null) return BadRequest("Invalid user");

        List<OrganizationViewModel> organizations = [];
        organizations.AddRange(user.OrganizationMemberships.Select(m => new OrganizationViewModel(m.Organization.Id, m.Organization.Name)));

        return Ok(new UserViewModel(user.Id, user.FullName, user?.Email ?? string.Empty, ReplaceUserName(user?.UserName), organizations));
    }

    [Authorize]
    [HttpPost("manage/profile")]
    [EndpointSummary("Update user profile")]
    [EndpointDescription("Updates the first name and last name of the authenticated user.")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileInputModel model)
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId)) return BadRequest("Invalid user");

        var user = await _usersService.GetUserByIdAsync(userId);

        if (user == null) return BadRequest("Invalid user");

        user.FirstName = model.FirstName;
        user.LastName = model.LastName;

        await _usersService.UpdateUserAsync(user);

        List<OrganizationViewModel> organizations = [];
        organizations.AddRange(user.OrganizationMemberships.Select(m => new OrganizationViewModel(m.Organization.Id, m.Organization.Name)));

        return Ok(new UserViewModel(user.Id, user.FullName, user.Email ?? string.Empty, ReplaceUserName(user?.UserName), organizations));
    }

    [Authorize]
    [HttpPost("manage/avatar")]
    [EndpointSummary("Upload avatar")]
    [EndpointDescription("Uploads or replaces the authenticated user's avatar image.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UploadAvatar([FromForm] UploadAvatarRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User is not authenticated.");

        try
        {
            using var stream = request.File.OpenReadStream();
            var attachment = await _attachmentService.UploadUserAvatarAsync(
                userId, stream, request.File.FileName, request.File.ContentType);

            return Ok(new { attachment.Id, attachment.FileName, attachment.ContentType });
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [Authorize]
    [HttpDelete("manage/avatar")]
    [EndpointSummary("Delete avatar")]
    [EndpointDescription("Deletes the authenticated user's avatar image.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAvatar()
    {
        var userId = User.Claims.FirstOrDefault(a => a.Type == ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(userId))
            return Unauthorized("User is not authenticated.");

        var user = await _usersService.GetUserByIdAsync(userId);
        if (user?.Avatar is null)
            return NotFound();

        await _attachmentService.DeleteAttachmentAsync(user.Avatar.Id);
        return NoContent();
    }

    private static string ReplaceUserName(string? email)
    {
        return string.IsNullOrEmpty(email) ? string.Empty : email.Split('@')[0];
    }

    private string? GetClientIpAddress()
    {
        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }

    private string? GetUserAgent()
    {
        return Request.Headers.UserAgent.FirstOrDefault();
    }
}
