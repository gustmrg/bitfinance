using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Business.Helpers;
using BitFinance.Business.Interfaces;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace BitFinance.API.Services;

public class TokenService : ITokenService
{
    private readonly JwtSettings _jwtSettings;
    private readonly IRefreshTokenRepository _refreshTokenRepository;

    private const int RefreshTokenExpirationDays = 7;

    public TokenService(IOptions<JwtSettings> jwtSettings, IRefreshTokenRepository refreshTokenRepository)
    {
        _jwtSettings = jwtSettings.Value;
        _refreshTokenRepository = refreshTokenRepository;
    }

    public string GenerateAccessToken(User user)
    {
        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtSettings.Key));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim("firstName", user.FirstName),
            new Claim("lastName", user.LastName)
        };

        var token = new JwtSecurityToken(
            issuer: _jwtSettings.Issuer,
            audience: _jwtSettings.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_jwtSettings.ExpirationInMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (string RawToken, RefreshToken Entity) GenerateRefreshToken(
        User user,
        Guid? tokenFamilyId = null,
        string? ipAddress = null,
        string? userAgent = null)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var rawToken = Convert.ToBase64String(randomBytes);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            TokenHash = HashToken(rawToken),
            UserId = user.Id,
            TokenFamilyId = tokenFamilyId ?? Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddDays(RefreshTokenExpirationDays),
            CreatedAt = DateTime.UtcNow,
            CreatedByIp = ipAddress,
            UserAgent = userAgent,
            IsRevoked = false
        };

        return (rawToken, refreshToken);
    }

    public async Task<RefreshToken?> ValidateRefreshTokenAsync(string refreshToken)
    {
        var tokenHash = HashToken(refreshToken);
        var storedToken = await _refreshTokenRepository.GetByTokenHashAsync(tokenHash);

        if (storedToken == null)
            return null;

        if (storedToken.IsRevoked)
        {
            await _refreshTokenRepository.RevokeTokenFamilyAsync(
                storedToken.TokenFamilyId,
                "Token reuse detected - possible token theft");
            return null;
        }

        if (storedToken.IsExpired)
            return null;

        return storedToken;
    }

    public async Task<(string AccessToken, string RefreshToken, RefreshToken Entity)?> RotateRefreshTokenAsync(
        RefreshToken currentToken,
        string? ipAddress = null,
        string? userAgent = null)
    {
        if (!currentToken.IsActive)
        {
            await _refreshTokenRepository.RevokeTokenFamilyAsync(
                currentToken.TokenFamilyId,
                "Token reuse detected during rotation");
            return null;
        }

        var accessToken = GenerateAccessToken(currentToken.User);
        var (rawRefreshToken, newRefreshTokenEntity) = GenerateRefreshToken(
            currentToken.User,
            currentToken.TokenFamilyId,
            ipAddress,
            userAgent);

        await _refreshTokenRepository.CreateAsync(newRefreshTokenEntity);

        currentToken.IsRevoked = true;
        currentToken.RevokedAt = DateTime.UtcNow;
        currentToken.RevokedReason = "Rotated";
        currentToken.ReplacedByTokenId = newRefreshTokenEntity.Id;

        await _refreshTokenRepository.UpdateAsync(currentToken);

        return (accessToken, rawRefreshToken, newRefreshTokenEntity);
    }

    public string HashToken(string token)
    {
        if (string.IsNullOrEmpty(token))
            return string.Empty;

        return TokenHasher.HashToken(token);
    }

    [Obsolete("Use GenerateAccessToken instead")]
    public string GenerateToken(User user) => GenerateAccessToken(user);
}
