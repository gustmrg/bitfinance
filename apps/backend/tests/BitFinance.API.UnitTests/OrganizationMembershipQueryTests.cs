using BitFinance.API.Services;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace BitFinance.API.UnitTests;

public class OrganizationMembershipQueryTests : IDisposable
{
    private const string MemberId = "member-id";
    private static readonly Guid OrganizationId = Guid.NewGuid();

    private readonly ApplicationDbContext _dbContext;

    public OrganizationMembershipQueryTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _dbContext.AddRange(
            new Organization { Id = OrganizationId, Name = "Own", TimeZoneId = "UTC" },
            new User { Id = MemberId, FirstName = "Test", LastName = "Member" },
            new OrganizationMember { UserId = MemberId, OrganizationId = OrganizationId });
        _dbContext.SaveChanges();
        _dbContext.ChangeTracker.Clear();
    }

    public void Dispose() => _dbContext.Dispose();

    [Fact]
    public async Task IsUserInOrganizationAsync_Member_ReturnsTrue()
    {
        var service = new UsersService(new UsersRepository(_dbContext));

        Assert.True(await service.IsUserInOrganizationAsync(MemberId, OrganizationId));
    }

    [Fact]
    public async Task IsUserInOrganizationAsync_MemberOfAnotherOrganization_ReturnsFalse()
    {
        var service = new UsersService(new UsersRepository(_dbContext));

        Assert.False(await service.IsUserInOrganizationAsync(MemberId, Guid.NewGuid()));
    }

    [Fact]
    public async Task IsUserInOrganizationAsync_UnknownUser_ReturnsFalse()
    {
        var service = new UsersService(new UsersRepository(_dbContext));

        Assert.False(await service.IsUserInOrganizationAsync("unknown-user", OrganizationId));
    }

    [Fact]
    public async Task GetWithoutRelationsAsync_ReturnsOrganizationSettingsUntracked()
    {
        var repository = new OrganizationsRepository(_dbContext);

        var organization = await repository.GetWithoutRelationsAsync(OrganizationId);

        Assert.NotNull(organization);
        Assert.Equal("UTC", organization.TimeZoneId);
        Assert.Empty(organization.Members);
        Assert.Empty(_dbContext.ChangeTracker.Entries());
    }

    [Fact]
    public async Task GetWithoutRelationsAsync_UnknownOrganization_ReturnsNull()
    {
        var repository = new OrganizationsRepository(_dbContext);

        Assert.Null(await repository.GetWithoutRelationsAsync(Guid.NewGuid()));
    }
}
