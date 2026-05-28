using BitFinance.Business.Entities;

namespace BitFinance.Business.Interfaces;

/// <summary>
/// Provides operations for generating, validating, and rotating JWT access and refresh tokens.
/// </summary>
public interface ITokenService
{
    /// <summary>
    /// Generates a signed JWT access token for the specified user.
    /// </summary>
    /// <param name="user">The user to generate the token for.</param>
    /// <returns>The signed JWT access token string.</returns>
    string GenerateAccessToken(User user);

    /// <summary>
    /// Generates a new refresh token for the specified user.
    /// </summary>
    /// <param name="user">The user to generate the token for.</param>
    /// <param name="tokenFamilyId">An optional family ID to group related tokens for reuse detection. A new family is created if not provided.</param>
    /// <param name="ipAddress">The IP address of the requesting client.</param>
    /// <param name="userAgent">The User-Agent header of the requesting client.</param>
    /// <returns>A tuple containing the raw token string and the persisted <see cref="RefreshToken"/> entity.</returns>
    (string RawToken, RefreshToken Entity) GenerateRefreshToken(
        User user,
        Guid? tokenFamilyId = null,
        string? ipAddress = null,
        string? userAgent = null);

    /// <summary>
    /// Validates a raw refresh token string and returns the corresponding entity if valid.
    /// </summary>
    /// <param name="refreshToken">The raw refresh token to validate.</param>
    /// <returns>The <see cref="RefreshToken"/> entity if valid; otherwise, <c>null</c>.</returns>
    Task<RefreshToken?> ValidateRefreshTokenAsync(string refreshToken);

    /// <summary>
    /// Rotates a refresh token by revoking the current one and issuing a new token pair.
    /// </summary>
    /// <param name="currentToken">The current refresh token to rotate.</param>
    /// <param name="ipAddress">The IP address of the requesting client.</param>
    /// <param name="userAgent">The User-Agent header of the requesting client.</param>
    /// <returns>A tuple with the new access token, raw refresh token, and refresh token entity; or <c>null</c> if rotation fails.</returns>
    Task<(string AccessToken, string RefreshToken, RefreshToken Entity)?> RotateRefreshTokenAsync(
        RefreshToken currentToken,
        string? ipAddress = null,
        string? userAgent = null);

    /// <summary>
    /// Computes a SHA-256 hash of the given token string.
    /// </summary>
    /// <param name="token">The raw token to hash.</param>
    /// <returns>The Base64-encoded hash of the token.</returns>
    string HashToken(string token);

    [Obsolete("Use GenerateAccessToken instead")]
    string GenerateToken(User user);
}
