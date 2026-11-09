using System.Text;
using BitFinance.API.Extensions;
using BitFinance.Data.Contexts;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Xunit;

namespace BitFinance.API.UnitTests;

public sealed class HealthCheckConfigurationTests
{
    [Theory]
    [InlineData(false, false)]
    [InlineData(true, true)]
    public void AddBitFinanceHealthChecks_RegistersCacheOnlyWhenEnabled(
        bool cacheEnabled,
        bool expectsCache)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AppSettings:CacheEnabled"] = cacheEnabled.ToString()
            })
            .Build();
        var services = new ServiceCollection();
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql("Host=localhost;Database=health;Username=health;Password=health"));

        services.AddBitFinanceHealthChecks(configuration);

        using var provider = services.BuildServiceProvider();
        var registrations = provider
            .GetRequiredService<IOptions<HealthCheckServiceOptions>>()
            .Value
            .Registrations;

        Assert.Contains(registrations, registration =>
            registration.Name == "postgresql" && registration.Tags.Contains("ready"));
        Assert.Equal(expectsCache, registrations.Any(registration =>
            registration.Name == "cache" && registration.Tags.Contains("ready")));
    }

    [Fact]
    public async Task WriteHealthResponseAsync_ExposesOnlyAggregateStatus()
    {
        const string sentinel = "PRIVATE_DEPENDENCY_DETAIL_SENTINEL";
        var entries = new Dictionary<string, HealthReportEntry>
        {
            ["postgresql"] = new(
                HealthStatus.Healthy,
                "Database host detail",
                TimeSpan.FromMilliseconds(1),
                null,
                new Dictionary<string, object>(),
                ["ready"]),
            ["cache"] = new(
                HealthStatus.Unhealthy,
                sentinel,
                TimeSpan.FromMilliseconds(1),
                new InvalidOperationException(sentinel),
                new Dictionary<string, object> { ["detail"] = sentinel },
                ["ready"])
        };
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await HealthCheckExtensions.WriteHealthResponseAsync(
            context,
            new HealthReport(entries, TimeSpan.FromMilliseconds(2)));

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync();

        Assert.Equal("application/json", context.Response.ContentType);
        Assert.Equal("""{"status":"Unhealthy"}""", body);
        Assert.DoesNotContain("postgresql", body);
        Assert.DoesNotContain("cache", body);
        Assert.DoesNotContain(sentinel, body);
    }
}
