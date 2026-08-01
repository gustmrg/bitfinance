using System.Text.Json;
using BitFinance.API.Health;
using BitFinance.Data.Contexts;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BitFinance.API.Extensions;

public static class HealthCheckExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IServiceCollection AddBitFinanceHealthChecks(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var healthChecks = services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>(
                "postgresql",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);

        if (configuration.GetValue<bool>("AppSettings:CacheEnabled"))
        {
            healthChecks.AddCheck<DistributedCacheHealthCheck>(
                "cache",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);
        }

        return services;
    }

    public static WebApplication MapBitFinanceHealthChecks(this WebApplication app)
    {
        app.MapHealthChecks("/health/live", CreateOptions(_ => false))
            .ExcludeFromDescription();
        app.MapHealthChecks("/health/ready", CreateOptions(
                registration => registration.Tags.Contains("ready")))
            .ExcludeFromDescription();
        app.MapHealthChecks("/health", CreateOptions(
                registration => registration.Tags.Contains("ready")))
            .ExcludeFromDescription();

        return app;
    }

    public static Task WriteHealthResponseAsync(HttpContext context, HealthReport report)
    {
        context.Response.ContentType = "application/json";
        return JsonSerializer.SerializeAsync(
            context.Response.Body,
            new HealthResponse(report.Status.ToString()),
            JsonOptions,
            context.RequestAborted);
    }

    private static HealthCheckOptions CreateOptions(
        Func<HealthCheckRegistration, bool> predicate)
    {
        return new HealthCheckOptions
        {
            Predicate = predicate,
            ResponseWriter = WriteHealthResponseAsync
        };
    }

    private sealed record HealthResponse(string Status);
}
