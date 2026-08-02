using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace BitFinance.API.Observability;

public static class WorkerTelemetry
{
    public const string BillStatus = "bill_status";
    public const string NotificationDispatch = "notification_dispatch";
    public const string RefreshTokenCleanup = "refresh_token_cleanup";

    private static readonly HashSet<string> WorkerNames =
    [
        BillStatus,
        NotificationDispatch,
        RefreshTokenCleanup
    ];

    private static readonly Histogram<double> RunDuration = BitFinanceTelemetry.Meter.CreateHistogram<double>(
        "bitfinance.worker.run.duration",
        unit: "s",
        description: "Duration of a worker cycle.");
    private static readonly Counter<long> RunCount = BitFinanceTelemetry.Meter.CreateCounter<long>(
        "bitfinance.worker.run.count",
        unit: "{run}",
        description: "Number of completed worker cycles.");
    private static readonly Counter<long> FailureCount = BitFinanceTelemetry.Meter.CreateCounter<long>(
        "bitfinance.worker.failure.count",
        unit: "{failure}",
        description: "Number of failed worker cycles.");
    private static readonly ConcurrentDictionary<string, long> LastSuccess = new(StringComparer.Ordinal);
    private static readonly ObservableGauge<long> LastSuccessGauge = BitFinanceTelemetry.Meter.CreateObservableGauge(
        "bitfinance.worker.last_success",
        ObserveLastSuccess,
        unit: "s",
        description: "Unix timestamp of the last successful worker cycle.");

    public static async Task RunCycleAsync(
        string workerName,
        Func<CancellationToken, Task> operation,
        CancellationToken cancellationToken)
    {
        if (!WorkerNames.Contains(workerName))
        {
            throw new ArgumentOutOfRangeException(nameof(workerName), "Worker name is not registered.");
        }
        ArgumentNullException.ThrowIfNull(operation);

        var startedAt = Stopwatch.GetTimestamp();
        var activity = StartActivitySafely(workerName);
        var outcome = "success";

        try
        {
            await operation(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            outcome = "cancelled";
            throw;
        }
        catch (Exception)
        {
            outcome = "error";
            SetErrorSafely(activity);
            throw;
        }
        finally
        {
            CompleteActivitySafely(activity, outcome);
            RecordSafely(workerName, outcome, Stopwatch.GetElapsedTime(startedAt).TotalSeconds);
        }
    }

    private static void RecordSafely(string workerName, string outcome, double durationSeconds)
    {
        try
        {
            var tags = new TagList
            {
                { "worker.name", workerName },
                { "outcome", outcome }
            };
            RunDuration.Record(durationSeconds, tags);
            RunCount.Add(1, tags);
            if (outcome == "error")
            {
                FailureCount.Add(1, tags);
            }
            else if (outcome == "success")
            {
                LastSuccess[workerName] = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            }
        }
        catch
        {
            // Telemetry is best-effort and must never change worker behavior.
        }
    }

    private static IEnumerable<Measurement<long>> ObserveLastSuccess() =>
        LastSuccess.Select(pair => new Measurement<long>(pair.Value,
            new KeyValuePair<string, object?>("worker.name", pair.Key)));

    private static Activity? StartActivitySafely(string workerName)
    {
        try
        {
            var activity = BitFinanceTelemetry.ActivitySource.StartActivity(
                $"worker.{workerName}",
                ActivityKind.Internal);
            activity?.SetTag("worker.name", workerName);
            return activity;
        }
        catch
        {
            return null;
        }
    }

    private static void SetErrorSafely(Activity? activity)
    {
        try
        {
            activity?.SetStatus(ActivityStatusCode.Error);
        }
        catch
        {
        }
    }

    private static void CompleteActivitySafely(Activity? activity, string outcome)
    {
        try
        {
            activity?.SetTag("outcome", outcome);
            activity?.Dispose();
        }
        catch
        {
        }
    }
}
