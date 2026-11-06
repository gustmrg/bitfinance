using System.IdentityModel.Tokens.Jwt;
using BitFinance.API.Services;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class SessionTokenTests
{
    private readonly Mock<IRefreshTokenRepository> _repository = new();
    private TokenService CreateService() => new(Options.Create(new JwtSettings
    {
        Key = "test-signing-key-only-at-least-256-bits-0123456789",
        Issuer = "test", Audience = "test", ExpirationInMinutes = 17
    }), _repository.Object);
    private static User TestUser() => new() { Id = "user", Email = "test@example.com", FirstName = "Test", LastName = "User" };
    private static RefreshToken ActiveToken() => new()
    {
        Id = Guid.NewGuid(), User = TestUser(), UserId = "user", TokenFamilyId = Guid.NewGuid(),
        ExpiresAt = DateTime.UtcNow.AddDays(1)
    };

    [Fact]
    public void AccessTokenUsesConfiguredLifetime()
    {
        var token = new JwtSecurityTokenHandler().ReadJwtToken(CreateService().GenerateAccessToken(TestUser()));
        Assert.InRange(token.ValidTo, DateTime.UtcNow.AddMinutes(16.9), DateTime.UtcNow.AddMinutes(17.1));
    }
    [Fact]
    public void RefreshTokenStoresOnlyHashAndRetainsSevenDayExpiry()
    {
        var service = CreateService();
        var (raw, entity) = service.GenerateRefreshToken(TestUser());
        Assert.NotEqual(raw, entity.TokenHash);
        Assert.Equal(service.HashToken(raw), entity.TokenHash);
        Assert.InRange(entity.ExpiresAt, DateTime.UtcNow.AddDays(6.99), DateTime.UtcNow.AddDays(7.01));
    }
    [Fact]
    public async Task InvalidTokenIsRejected()
    {
        Assert.Null(await CreateService().ValidateRefreshTokenAsync("missing"));
    }
    [Fact]
    public async Task ExpiredTokenIsRejected()
    {
        var token = ActiveToken(); token.ExpiresAt = DateTime.UtcNow.AddSeconds(-1);
        _repository.Setup(repo => repo.GetByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(token);
        Assert.Null(await CreateService().ValidateRefreshTokenAsync("expired"));
    }
    [Fact]
    public async Task ReuseRevokesTheWholeFamily()
    {
        var token = ActiveToken(); token.IsRevoked = true;
        _repository.Setup(repo => repo.GetByTokenHashAsync(It.IsAny<string>())).ReturnsAsync(token);
        Assert.Null(await CreateService().ValidateRefreshTokenAsync("reused"));
        _repository.Verify(repo => repo.RevokeTokenFamilyAsync(token.TokenFamilyId, It.IsAny<string>()), Times.Once);
    }
    [Fact]
    public async Task RotationAtomicallyPersistsSuccessorInSameFamily()
    {
        var token = ActiveToken();
        _repository.Setup(repo => repo.TryRotateAsync(token.Id, It.IsAny<RefreshToken>())).ReturnsAsync(true);
        var result = await CreateService().RotateRefreshTokenAsync(token);
        Assert.NotNull(result);
        Assert.Equal(token.TokenFamilyId, result.Value.Entity.TokenFamilyId);
        Assert.Equal(result.Value.Entity.Id, token.ReplacedByTokenId);
        Assert.True(token.IsRevoked);
        _repository.Verify(repo => repo.TryRotateAsync(token.Id, It.Is<RefreshToken>(next => next.UserId == token.UserId)), Times.Once);
        _repository.Verify(repo => repo.CreateAsync(It.IsAny<RefreshToken>()), Times.Never);
    }
    [Fact]
    public async Task ConcurrentRotationCannotIssueAnUnpersistedSuccessor()
    {
        var token = ActiveToken();
        _repository.Setup(repo => repo.TryRotateAsync(token.Id, It.IsAny<RefreshToken>())).ReturnsAsync(false);
        Assert.Null(await CreateService().RotateRefreshTokenAsync(token));
        _repository.Verify(repo => repo.RevokeTokenFamilyAsync(token.TokenFamilyId, It.IsAny<string>()), Times.Once);
    }
    [Theory]
    [InlineData("Development", false)]
    [InlineData("Production", true)]
    public void PersistentCookieIsHttpOnlyAndSecureInProduction(string environment, bool secure)
    {
        var host = new Mock<IWebHostEnvironment>(); host.SetupGet(env => env.EnvironmentName).Returns(environment);
        var cookieService = new CookieService(host.Object);
        var context = new DefaultHttpContext();
        cookieService.SetRefreshTokenCookie(context.Response, "opaque-refresh-token", DateTime.UtcNow.AddDays(7));
        var cookie = context.Response.Headers.SetCookie.ToString();
        Assert.Contains("httponly", cookie);
        Assert.Contains("expires=", cookie);
        Assert.Contains("max-age=", cookie);
        Assert.Contains("samesite=lax", cookie);
        Assert.Contains("path=/api/v1/identity", cookie);
        Assert.Equal(secure, cookie.Contains("secure"));
        var deletion = new DefaultHttpContext();
        cookieService.RemoveRefreshTokenCookie(deletion.Response);
        Assert.Contains("path=/api/v1/identity", deletion.Response.Headers.SetCookie.ToString());
    }
}
