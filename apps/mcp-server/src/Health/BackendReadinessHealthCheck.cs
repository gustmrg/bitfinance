using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BitFinance.MCP.Health;

public sealed class BackendReadinessHealthCheck(
    IHttpClientFactory httpClientFactory) : IHealthCheck
{
    public const string ClientName = "BitFinanceReadiness";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var client = httpClientFactory.CreateClient(ClientName);
            using var response = await client.GetAsync("/health/ready", cancellationToken);

            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy()
                : HealthCheckResult.Unhealthy("Backend API is not ready.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return HealthCheckResult.Unhealthy("Backend API readiness check timed out.");
        }
        catch (HttpRequestException)
        {
            return HealthCheckResult.Unhealthy("Backend API is unavailable.");
        }
    }
}
