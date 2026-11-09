using BitFinance.API.Services;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;
using FluentAssertions;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class TokenServiceTests
{
    private readonly Mock<IRefreshTokenRepository> _repositoryMock = new();
    private readonly List<RefreshToken> _tokens = [];
    private readonly User _user = new()
    {
        Id = "user-1",
        Email = "user@example.com",
        UserName = "user@example.com",
        FirstName = "Test",
        LastName = "User",
    };
    private readonly TokenService _sut;

    public TokenServiceTests()
    {
        _repositoryMock
            .Setup(repository => repository.GetByTokenHashAsync(It.IsAny<string>()))
            .ReturnsAsync((string hash) => _tokens.FirstOrDefault(token => token.TokenHash == hash));
        _repositoryMock
            .Setup(repository => repository.GetTokensByFamilyIdAsync(It.IsAny<Guid>()))
            .ReturnsAsync((Guid familyId) => _tokens.Where(token => token.TokenFamilyId == familyId).ToList());
        _repositoryMock
            .Setup(repository => repository.CreateAsync(It.IsAny<RefreshToken>()))
            .ReturnsAsync((RefreshToken token) =>
            {
                _tokens.Add(token);
                return token;
            });
        _repositoryMock
            .Setup(repository => repository.RevokeTokenFamilyAsync(It.IsAny<Guid>(), It.IsAny<string>()))
            .Returns((Guid familyId, string reason) =>
            {
                foreach (var token in _tokens.Where(token => token.TokenFamilyId == familyId && !token.IsRevoked))
                {
                    token.IsRevoked = true;
                    token.RevokedAt = DateTime.UtcNow;
                    token.RevokedReason = reason;
                }

                return Task.CompletedTask;
            });

        var settings = Options.Create(new JwtSettings
        {
            Key = "unit-test-signing-key-with-at-least-32-bytes",
            Issuer = "bitfinance-tests",
            Audience = "bitfinance-tests",
        });
        _sut = new TokenService(settings, _repositoryMock.Object);
    }

    private string IssueToken(Guid? familyId = null)
    {
        var (raw, entity) = _sut.GenerateRefreshToken(_user, familyId);
        entity.User = _user;
        _tokens.Add(entity);
        return raw;
    }

    private async Task<(string Raw, RefreshToken Entity)> RefreshAsync(string raw)
    {
        var stored = await _sut.ValidateRefreshTokenAsync(raw);
        stored.Should().NotBeNull();
        var result = await _sut.RotateRefreshTokenAsync(stored!);
        result.Should().NotBeNull();
        result!.Value.Entity.User = _user;
        return (result.Value.RefreshToken, result.Value.Entity);
    }

    [Fact]
    public async Task Rotation_RevokesThePresentedTokenAndKeepsTheFamily()
    {
        var raw = IssueToken();
        var original = _tokens.Single();

        var (_, replacement) = await RefreshAsync(raw);

        original.IsRevoked.Should().BeTrue();
        original.RevokedReason.Should().Be("Rotated");
        original.ReplacedByTokenId.Should().Be(replacement.Id);
        replacement.TokenFamilyId.Should().Be(original.TokenFamilyId);
        replacement.IsActive.Should().BeTrue();
    }

    [Fact]
    public async Task ConcurrentRefresh_WithinGracePeriod_IssuesAnotherTokenWithoutRevokingTheFamily()
    {
        var raw = IssueToken();
        var original = _tokens.Single();
        var (_, first) = await RefreshAsync(raw);

        var (_, second) = await RefreshAsync(raw);

        first.IsActive.Should().BeTrue();
        second.IsActive.Should().BeTrue();
        second.TokenFamilyId.Should().Be(original.TokenFamilyId);
        original.ReplacedByTokenId.Should().Be(first.Id);
        _repositoryMock.Verify(
            repository => repository.RevokeTokenFamilyAsync(It.IsAny<Guid>(), It.IsAny<string>()),
            Times.Never);
    }

    [Fact]
    public async Task Reuse_AfterGracePeriod_RevokesTheWholeFamily()
    {
        var raw = IssueToken();
        var original = _tokens.Single();
        var (_, replacement) = await RefreshAsync(raw);
        original.RevokedAt = DateTime.UtcNow - TokenService.RotationGracePeriod - TimeSpan.FromSeconds(1);

        var stored = await _sut.ValidateRefreshTokenAsync(raw);

        stored.Should().BeNull();
        replacement.IsRevoked.Should().BeTrue();
    }

    [Fact]
    public async Task Reuse_WithinGracePeriod_AfterLogout_IsRejected()
    {
        var raw = IssueToken();
        var original = _tokens.Single();
        await RefreshAsync(raw);
        await _repositoryMock.Object.RevokeTokenFamilyAsync(original.TokenFamilyId, "User logout");

        var stored = await _sut.ValidateRefreshTokenAsync(raw);

        stored.Should().BeNull();
    }

    [Fact]
    public async Task RevokedForAnotherReason_IsRejectedEvenWithinGracePeriod()
    {
        var raw = IssueToken();
        var original = _tokens.Single();
        IssueToken(original.TokenFamilyId);
        original.IsRevoked = true;
        original.RevokedAt = DateTime.UtcNow;
        original.RevokedReason = "User logout";

        var stored = await _sut.ValidateRefreshTokenAsync(raw);

        stored.Should().BeNull();
        _tokens.Should().OnlyContain(token => token.IsRevoked);
    }

    [Fact]
    public async Task ExpiredToken_IsRejected()
    {
        var raw = IssueToken();
        _tokens.Single().ExpiresAt = DateTime.UtcNow.AddMinutes(-1);

        var stored = await _sut.ValidateRefreshTokenAsync(raw);

        stored.Should().BeNull();
    }
}
