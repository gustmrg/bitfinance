using System.Security.Claims;
using BitFinance.API.Controllers;
using BitFinance.API.Models;
using BitFinance.API.Services;
using BitFinance.API.Settings;
using BitFinance.Business.Entities;
using FluentAssertions;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class GoogleAuthServiceTests
{
    private readonly Mock<UserManager<User>> _userManagerMock;
    private readonly GoogleAuthService _sut;

    private static readonly GoogleIdentity VerifiedIdentity =
        new("google-sub", "ana@example.com", true, "Ana", "Souza");

    public GoogleAuthServiceTests()
    {
        _userManagerMock = new Mock<UserManager<User>>(
            Mock.Of<IUserStore<User>>(), null!, null!, null!, null!, null!, null!, null!, null!);
        _userManagerMock
            .Setup(manager => manager.CreateAsync(It.IsAny<User>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock
            .Setup(manager => manager.AddLoginAsync(It.IsAny<User>(), It.IsAny<UserLoginInfo>()))
            .ReturnsAsync(IdentityResult.Success);
        _userManagerMock
            .Setup(manager => manager.GetLoginsAsync(It.IsAny<User>()))
            .ReturnsAsync([]);
        _sut = new GoogleAuthService(_userManagerMock.Object, NullLogger<GoogleAuthService>.Instance);
    }

    private void SetupLinkedUser(User user) =>
        _userManagerMock
            .Setup(manager => manager.FindByLoginAsync(GoogleAuthService.LoginProvider, VerifiedIdentity.Subject))
            .ReturnsAsync(user);

    private void SetupGoogleLogin(User user, string providerKey = "other-sub") =>
        _userManagerMock
            .Setup(manager => manager.GetLoginsAsync(user))
            .ReturnsAsync([new UserLoginInfo(GoogleAuthService.LoginProvider, providerKey, "Google")]);

    [Fact]
    public async Task SignInAsync_ReturnsLinkedUser()
    {
        var user = new User { Id = "user-1" };
        SetupLinkedUser(user);

        var result = await _sut.SignInAsync(VerifiedIdentity);

        result.Success.Should().BeTrue();
        result.User.Should().BeSameAs(user);
        _userManagerMock.Verify(manager => manager.CreateAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task SignInAsync_CreatesUserWithoutPasswordAndLinksGoogle()
    {
        var result = await _sut.SignInAsync(VerifiedIdentity);

        result.Success.Should().BeTrue();
        result.User!.Email.Should().Be("ana@example.com");
        result.User.UserName.Should().Be("ana@example.com");
        result.User.EmailConfirmed.Should().BeTrue();
        result.User.FirstName.Should().Be("Ana");
        result.User.LastName.Should().Be("Souza");
        _userManagerMock.Verify(manager => manager.AddLoginAsync(
            result.User,
            It.Is<UserLoginInfo>(login => login.LoginProvider == "Google" && login.ProviderKey == "google-sub")));
    }

    [Fact]
    public async Task SignInAsync_RefusesEmailOfExistingAccount()
    {
        _userManagerMock
            .Setup(manager => manager.FindByEmailAsync(VerifiedIdentity.Email))
            .ReturnsAsync(new User { Id = "password-user" });

        var result = await _sut.SignInAsync(VerifiedIdentity);

        result.Error.Should().Be(GoogleAuthError.EmailInUse);
        _userManagerMock.Verify(manager => manager.AddLoginAsync(It.IsAny<User>(), It.IsAny<UserLoginInfo>()), Times.Never);
    }

    [Fact]
    public async Task SignInAsync_RefusesUnverifiedEmailForNewUser()
    {
        var result = await _sut.SignInAsync(VerifiedIdentity with { EmailVerified = false });

        result.Error.Should().Be(GoogleAuthError.EmailNotVerified);
        _userManagerMock.Verify(manager => manager.CreateAsync(It.IsAny<User>()), Times.Never);
    }

    [Fact]
    public async Task SignInAsync_DeletesCreatedUserWhenLinkFails()
    {
        _userManagerMock
            .Setup(manager => manager.AddLoginAsync(It.IsAny<User>(), It.IsAny<UserLoginInfo>()))
            .ReturnsAsync(IdentityResult.Failed(new IdentityError { Code = "LoginAlreadyAssociated" }));

        var result = await _sut.SignInAsync(VerifiedIdentity);

        result.Error.Should().Be(GoogleAuthError.IdentityFailure);
        _userManagerMock.Verify(manager => manager.DeleteAsync(It.IsAny<User>()));
    }

    [Fact]
    public async Task SignInAsync_RefusesLockedOutUser()
    {
        var user = new User { Id = "user-1" };
        SetupLinkedUser(user);
        _userManagerMock.Setup(manager => manager.IsLockedOutAsync(user)).ReturnsAsync(true);

        var result = await _sut.SignInAsync(VerifiedIdentity);

        result.Error.Should().Be(GoogleAuthError.LockedOut);
    }

    [Fact]
    public async Task LinkAsync_AddsGoogleLogin()
    {
        var user = new User { Id = "user-1" };
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(user);

        var result = await _sut.LinkAsync("user-1", VerifiedIdentity);

        result.Success.Should().BeTrue();
        _userManagerMock.Verify(manager => manager.AddLoginAsync(user, It.IsAny<UserLoginInfo>()));
    }

    [Fact]
    public async Task LinkAsync_RefusesGoogleAccountOwnedByAnotherUser()
    {
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(new User { Id = "user-1" });
        SetupLinkedUser(new User { Id = "user-2" });

        var result = await _sut.LinkAsync("user-1", VerifiedIdentity);

        result.Error.Should().Be(GoogleAuthError.LinkedToAnotherAccount);
    }

    [Fact]
    public async Task LinkAsync_IsIdempotentForSameUser()
    {
        var user = new User { Id = "user-1" };
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(user);
        SetupLinkedUser(user);

        var result = await _sut.LinkAsync("user-1", VerifiedIdentity);

        result.Success.Should().BeTrue();
        _userManagerMock.Verify(manager => manager.AddLoginAsync(It.IsAny<User>(), It.IsAny<UserLoginInfo>()), Times.Never);
    }

    [Fact]
    public async Task LinkAsync_RefusesSecondGoogleAccount()
    {
        var user = new User { Id = "user-1" };
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(user);
        SetupGoogleLogin(user);

        var result = await _sut.LinkAsync("user-1", VerifiedIdentity);

        result.Error.Should().Be(GoogleAuthError.AlreadyLinked);
    }

    [Fact]
    public async Task UnlinkAsync_RequiresPassword()
    {
        var user = new User { Id = "user-1" };
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(user);
        SetupGoogleLogin(user);
        _userManagerMock.Setup(manager => manager.HasPasswordAsync(user)).ReturnsAsync(false);

        var result = await _sut.UnlinkAsync("user-1");

        result.Error.Should().Be(GoogleAuthError.PasswordRequired);
        _userManagerMock.Verify(manager => manager.RemoveLoginAsync(It.IsAny<User>(), It.IsAny<string>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    public async Task UnlinkAsync_RemovesGoogleLogin()
    {
        var user = new User { Id = "user-1" };
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(user);
        SetupGoogleLogin(user, "google-sub");
        _userManagerMock.Setup(manager => manager.HasPasswordAsync(user)).ReturnsAsync(true);
        _userManagerMock
            .Setup(manager => manager.RemoveLoginAsync(user, "Google", "google-sub"))
            .ReturnsAsync(IdentityResult.Success);

        var result = await _sut.UnlinkAsync("user-1");

        result.Success.Should().BeTrue();
    }

    [Fact]
    public async Task UnlinkAsync_ReportsMissingGoogleLogin()
    {
        _userManagerMock.Setup(manager => manager.FindByIdAsync("user-1")).ReturnsAsync(new User { Id = "user-1" });

        var result = await _sut.UnlinkAsync("user-1");

        result.Error.Should().Be(GoogleAuthError.NotLinked);
    }

    [Fact]
    public void FromPrincipal_ReadsMappedGoogleClaims()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, "google-sub"),
            new Claim(ClaimTypes.Email, "ana@example.com"),
            new Claim("email_verified", "true"),
            new Claim(ClaimTypes.GivenName, "Ana"),
            new Claim(ClaimTypes.Surname, "Souza"),
        ]));

        GoogleIdentity.FromPrincipal(principal).Should().Be(VerifiedIdentity);
    }

    [Fact]
    public void FromPrincipal_ReturnsNullWithoutEmail()
    {
        var principal = new ClaimsPrincipal(new ClaimsIdentity([new Claim(ClaimTypes.NameIdentifier, "google-sub")]));

        GoogleIdentity.FromPrincipal(principal).Should().BeNull();
    }

    [Theory]
    [InlineData("/dashboard/bills?status=open", "/dashboard/bills?status=open")]
    [InlineData("//evil.example.com", "/dashboard")]
    [InlineData("/\\evil.example.com", "/dashboard")]
    [InlineData("https://evil.example.com", "/dashboard")]
    [InlineData(null, "/dashboard")]
    public void SafeReturnTo_OnlyAllowsLocalPaths(string? value, string expected)
    {
        ExternalIdentityController.SafeReturnTo(value, "/dashboard").Should().Be(expected);
    }

    [Fact]
    public void SettingsValidator_AllowsDisabledGoogle()
    {
        new GoogleAuthSettingsValidator().Validate(null, new GoogleAuthSettings()).Succeeded.Should().BeTrue();
    }

    [Fact]
    public void SettingsValidator_RequiresSecretAndRedirectUriWhenEnabled()
    {
        var result = new GoogleAuthSettingsValidator().Validate(null, new GoogleAuthSettings { ClientId = "client" });

        result.Failed.Should().BeTrue();
        result.Failures.Should().HaveCount(2);
    }
}
