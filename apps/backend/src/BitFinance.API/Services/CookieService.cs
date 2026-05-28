using BitFinance.API.Services.Interfaces;

namespace BitFinance.API.Services;

public class CookieService : ICookieService
{
    private const string RefreshTokenCookieName = "X-Refresh-Token";
    private readonly IWebHostEnvironment _environment;

    public CookieService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public void SetRefreshTokenCookie(HttpResponse response, string refreshToken, DateTime expires)
    {
        var maxAge = expires - DateTime.UtcNow;

        if (maxAge <= TimeSpan.Zero)
            maxAge = TimeSpan.Zero;
        
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            MaxAge = maxAge,
            Path = "/api/v1/identity",
            IsEssential = true
        };

        response.Cookies.Append(RefreshTokenCookieName, refreshToken, cookieOptions);
    }

    public string? GetRefreshTokenFromCookie(HttpRequest request)
    {
        return request.Cookies[RefreshTokenCookieName];
    }

    public void RemoveRefreshTokenCookie(HttpResponse response)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.Lax,
            Path = "/api/v1/identity"
        };

        response.Cookies.Delete(RefreshTokenCookieName, cookieOptions);
    }
}
