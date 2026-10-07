using System.Text;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Extensions;
using BitFinance.MCP.Health;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public sealed class HealthCheckConfigurationTests
{
    [Fact]
    public void AddMcpHealthChecks_RegistersDedicatedReadinessClientAndCheck()
    {
        var services = new ServiceCollection();
        var options = new BitFinanceOptions
        {
            ApiBaseUrl = new Uri("https://api.example")
        };

        services.AddMcpHealthChecks(options);

        using var provider = services.BuildServiceProvider();
        var client = provider
            .GetRequiredService<IHttpClientFactory>()
            .CreateClient(BackendReadinessHealthCheck.ClientName);
        var registrations = provider
            .GetRequiredService<IOptions<HealthCheckServiceOptions>>()
            .Value
            .Registrations;

        Assert.Equal(options.ApiBaseUrl, client.BaseAddress);
        Assert.Equal(TimeSpan.FromSeconds(3), client.Timeout);
        Assert.Null(client.DefaultRequestHeaders.Authorization);
        Assert.Contains(registrations, registration =>
            registration.Name == "backend-api" && registration.Tags.Contains("ready"));
    }

    [Fact]
    public async Task WriteHealthResponseAsync_ExposesOnlyAggregateStatus()
    {
        const string sentinel = "PRIVATE_BACKEND_DETAIL_SENTINEL";
        var entries = new Dictionary<string, HealthReportEntry>
        {
            ["backend-api"] = new(
                HealthStatus.Unhealthy,
                sentinel,
                TimeSpan.FromMilliseconds(1),
                new HttpRequestException(sentinel),
                new Dictionary<string, object> { ["detail"] = sentinel },
                ["ready"])
        };
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        await HealthCheckExtensions.WriteHealthResponseAsync(
            context,
            new HealthReport(entries, TimeSpan.FromMilliseconds(1)));

        context.Response.Body.Position = 0;
        using var reader = new StreamReader(context.Response.Body, Encoding.UTF8);
        var body = await reader.ReadToEndAsync();

        Assert.Equal("application/json", context.Response.ContentType);
        Assert.Equal("""{"status":"Unhealthy"}""", body);
        Assert.DoesNotContain("backend-api", body);
        Assert.DoesNotContain(sentinel, body);
    }
}
