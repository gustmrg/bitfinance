using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BitFinance.API.Health;

public sealed class DistributedCacheHealthCheck(
    IDistributedCache cache) : IHealthCheck
{
    private const string ProbeKey = "__bitfinance_healthcheck_reserved_missing__";

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            await cache.GetAsync(ProbeKey, cancellationToken);
            return HealthCheckResult.Healthy();
        }
        catch
        {
            return HealthCheckResult.Unhealthy("Cache dependency is unavailable.");
        }
    }
}
