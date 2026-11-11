using System.Net;
using BitFinance.API.Extensions;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Hosting.Server;
using Microsoft.AspNetCore.Hosting.Server.Features;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Xunit;

namespace BitFinance.API.UnitTests;

public class AuthRateLimitingTests
{
    [Fact]
    public async Task CredentialsPolicy_RejectsRequestsOverTheLimitWithRetryAfter()
    {
        await using var app = await StartAppAsync(new Dictionary<string, string?>
        {
            ["RateLimiting:Auth:CredentialPermitLimit"] = "2",
            ["RateLimiting:Auth:WindowSeconds"] = "60"
        });
        using var client = new HttpClient { BaseAddress = GetBaseAddress(app) };

        var first = await client.GetAsync("/credentials");
        var second = await client.GetAsync("/credentials");
        var third = await client.GetAsync("/credentials");

        Assert.Equal(HttpStatusCode.OK, first.StatusCode);
        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, third.StatusCode);
        Assert.NotNull(third.Headers.RetryAfter?.Delta);
        Assert.Contains("Too many requests", await third.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task Policies_CountRequestsSeparatelyAndLeaveOtherEndpointsUnlimited()
    {
        await using var app = await StartAppAsync(new Dictionary<string, string?>
        {
            ["RateLimiting:Auth:CredentialPermitLimit"] = "1",
            ["RateLimiting:Auth:RefreshPermitLimit"] = "1"
        });
        using var client = new HttpClient { BaseAddress = GetBaseAddress(app) };

        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/credentials")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/credentials")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/refresh")).StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, (await client.GetAsync("/refresh")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/open")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await client.GetAsync("/open")).StatusCode);
    }

    [Fact]
    public async Task CredentialsPolicy_CountsEachForwardedClientSeparatelyWhenTheProxyIsTrusted()
    {
        await using var app = await StartAppAsync(new Dictionary<string, string?>
        {
            ["RateLimiting:Auth:CredentialPermitLimit"] = "1",
            ["ForwardedHeaders:KnownNetworks:0"] = "127.0.0.0/8"
        });
        using var client = new HttpClient { BaseAddress = GetBaseAddress(app) };

        var firstClient = await SendFromAsync(client, "203.0.113.10");
        var firstClientAgain = await SendFromAsync(client, "203.0.113.10");
        var secondClient = await SendFromAsync(client, "203.0.113.20");

        Assert.Equal(HttpStatusCode.OK, firstClient.StatusCode);
        Assert.Equal(HttpStatusCode.TooManyRequests, firstClientAgain.StatusCode);
        Assert.Equal(HttpStatusCode.OK, secondClient.StatusCode);
    }

    [Fact]
    public void AddHttpOptions_TrustsConfiguredProxyNetworks()
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ForwardedHeaders:KnownNetworks:0"] = "172.16.0.0/12",
                ["ForwardedHeaders:KnownNetworks:1"] = ""
            })
            .Build();
        var services = new ServiceCollection();
        services.AddHttpOptions(configuration);

        var options = services.BuildServiceProvider()
            .GetRequiredService<IOptions<ForwardedHeadersOptions>>().Value;

        Assert.Contains(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("172.18.0.1")));
        Assert.DoesNotContain(options.KnownIPNetworks, network => network.Contains(IPAddress.Parse("10.0.0.1")));
    }

    private static Task<HttpResponseMessage> SendFromAsync(HttpClient client, string forwardedFor)
    {
        var request = new HttpRequestMessage(HttpMethod.Get, "/credentials");
        request.Headers.Add("X-Forwarded-For", forwardedFor);
        return client.SendAsync(request);
    }

    private static async Task<WebApplication> StartAppAsync(Dictionary<string, string?> settings)
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration.AddInMemoryCollection(settings);
        builder.WebHost.UseUrls("http://127.0.0.1:0");
        builder.Services.AddHttpOptions(builder.Configuration);
        builder.Services.AddAuthRateLimiting(builder.Configuration);

        var app = builder.Build();
        app.UseForwardedHeaders();
        app.UseRateLimiter();
        app.MapGet("/credentials", () => Results.Ok()).RequireRateLimiting(RateLimitPolicies.Credentials);
        app.MapGet("/refresh", () => Results.Ok()).RequireRateLimiting(RateLimitPolicies.Refresh);
        app.MapGet("/open", () => Results.Ok());

        await app.StartAsync();
        return app;
    }

    private static Uri GetBaseAddress(WebApplication app)
    {
        var addresses = app.Services.GetRequiredService<IServer>().Features.Get<IServerAddressesFeature>()!;
        return new Uri(addresses.Addresses.Single());
    }
}
