using System.Collections.Concurrent;
using System.Diagnostics.Metrics;
using BitFinance.API.Observability;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace BitFinance.API.Health;

public sealed class DependencyStatusPublisher : IHealthCheckPublisher
{
    private static readonly ConcurrentDictionary<string, int> Statuses = new(StringComparer.Ordinal);

    private static readonly ObservableGauge<int> StatusGauge = BitFinanceTelemetry.Meter.CreateObservableGauge(
        "bitfinance.dependency.status",
        Observe,
        description: "1 when the last periodic check of a dependency succeeded, 0 otherwise.");

    public Task PublishAsync(HealthReport report, CancellationToken cancellationToken)
    {
        foreach (var (name, entry) in report.Entries)
        {
            Statuses[name] = entry.Status == HealthStatus.Healthy ? 1 : 0;
        }

        return Task.CompletedTask;
    }

    public static IReadOnlyDictionary<string, int> Snapshot() => new Dictionary<string, int>(Statuses);

    private static IEnumerable<Measurement<int>> Observe() =>
        Statuses.Select(pair => new Measurement<int>(pair.Value,
            new KeyValuePair<string, object?>("dependency", pair.Key)));
}
