using System.Text.Json;
using BitFinance.MCP.Configuration;
using BitFinance.MCP.Health;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BitFinance.MCP.Extensions;

public static class HealthCheckExtensions
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static IServiceCollection AddMcpHealthChecks(
        this IServiceCollection services,
        BitFinanceOptions options)
    {
        services.AddHttpClient(BackendReadinessHealthCheck.ClientName, client =>
        {
            client.BaseAddress = options.ApiBaseUrl;
            client.Timeout = TimeSpan.FromSeconds(3);
        });

        services.AddHealthChecks()
            .AddCheck<BackendReadinessHealthCheck>(
                "backend-api",
                failureStatus: HealthStatus.Unhealthy,
                tags: ["ready"]);

        return services;
    }

    public static WebApplication MapMcpHealthChecks(this WebApplication app)
    {
        app.MapHealthChecks("/health/live", CreateOptions(_ => false));
        app.MapHealthChecks("/health/ready", CreateOptions(
            registration => registration.Tags.Contains("ready")));
        app.MapHealthChecks("/health", CreateOptions(
            registration => registration.Tags.Contains("ready")));

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
