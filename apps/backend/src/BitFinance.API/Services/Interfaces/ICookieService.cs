namespace BitFinance.API.Services.Interfaces;

/// <summary>
/// Manages HTTP cookies for refresh token storage.
/// </summary>
public interface ICookieService
{
    /// <summary>
    /// Sets a secure HTTP-only cookie containing the refresh token.
    /// </summary>
    /// <param name="response">The HTTP response to set the cookie on.</param>
    /// <param name="refreshToken">The refresh token value.</param>
    /// <param name="expires">The cookie expiration date and time.</param>
    void SetRefreshTokenCookie(HttpResponse response, string refreshToken, DateTime expires);

    /// <summary>
    /// Reads the refresh token value from the request cookie.
    /// </summary>
    /// <param name="request">The HTTP request to read the cookie from.</param>
    /// <returns>The refresh token string, or <c>null</c> if the cookie is not present.</returns>
    string? GetRefreshTokenFromCookie(HttpRequest request);

    /// <summary>
    /// Removes the refresh token cookie from the response.
    /// </summary>
    /// <param name="response">The HTTP response to remove the cookie from.</param>
    void RemoveRefreshTokenCookie(HttpResponse response);
}
