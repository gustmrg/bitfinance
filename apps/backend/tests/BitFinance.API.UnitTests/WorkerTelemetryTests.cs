using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using BitFinance.API.Observability;
using FluentAssertions;
using Xunit;

namespace BitFinance.API.UnitTests;

[Collection(TelemetryTestCollection.Name)]
public sealed class WorkerTelemetryTests
{
    [Fact]
    public async Task RunCycle_EmitsOneBoundedEventForEveryOutcome()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        var activities = new ConcurrentBag<Activity>();
        using var meterListener = CreateMeterListener(measurements);
        using var activityListener = CreateActivityListener(activities);

        await WorkerTelemetry.RunCycleAsync(WorkerTelemetry.BillStatus, _ => Task.CompletedTask, default);

        var failure = new InvalidOperationException("worker failure");
        var thrownFailure = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            WorkerTelemetry.RunCycleAsync(
                WorkerTelemetry.NotificationDispatch,
                _ => Task.FromException(failure),
                default));

        using var cancellationSource = new CancellationTokenSource();
        cancellationSource.Cancel();
        var cancellation = new OperationCanceledException(cancellationSource.Token);
        var thrownCancellation = await Assert.ThrowsAsync<OperationCanceledException>(() =>
            WorkerTelemetry.RunCycleAsync(
                WorkerTelemetry.RefreshTokenCleanup,
                _ => Task.FromException(cancellation),
                cancellationSource.Token));

        thrownFailure.Should().BeSameAs(failure);
        thrownCancellation.Should().BeSameAs(cancellation);

        var runs = measurements.Where(item => item.Name == "bitfinance.worker.run.count").ToList();
        runs.Should().HaveCount(3);
        runs.Select(item => item.Tag("worker.name")).Should().BeEquivalentTo(
            WorkerTelemetry.BillStatus,
            WorkerTelemetry.NotificationDispatch,
            WorkerTelemetry.RefreshTokenCleanup);
        runs.Select(item => item.Tag("outcome")).Should().BeEquivalentTo("success", "error", "cancelled");

        var durations = measurements.Where(item => item.Name == "bitfinance.worker.run.duration").ToList();
        durations.Should().HaveCount(3);
        durations.Should().OnlyContain(item => item.Value >= 0 && item.Unit == "s");
        measurements.Count(item => item.Name == "bitfinance.worker.failure.count").Should().Be(1);

        activities.Should().HaveCount(3);
        activities.Should().OnlyContain(activity =>
            activity.TagObjects.Count() == 2 &&
            activity.TagObjects.Any(tag => tag.Key == "worker.name") &&
            activity.TagObjects.Any(tag => tag.Key == "outcome"));
    }

    [Fact]
    public async Task BacklogTelemetry_PerformsAtMostOneAggregateQueryPerMinute()
    {
        using var telemetry = new OutboxTelemetry();
        var queryCount = 0;
        var start = new DateTimeOffset(2026, 8, 1, 12, 0, 0, TimeSpan.Zero);
        Task<OutboxBacklogSnapshot> Query(CancellationToken _)
        {
            queryCount++;
            return Task.FromResult(new OutboxBacklogSnapshot(4, start.UtcDateTime.AddMinutes(-2)));
        }

        await telemetry.RefreshBacklogAsync(Query, start);
        await telemetry.RefreshBacklogAsync(Query, start.AddSeconds(59));
        await telemetry.RefreshBacklogAsync(Query, start.AddMinutes(1));

        queryCount.Should().Be(2);
        telemetry.BacklogQueryCount.Should().Be(2);
    }

    [Fact]
    public async Task BacklogTelemetry_QueryFailure_DoesNotEscape()
    {
        using var telemetry = new OutboxTelemetry();
        var action = () => telemetry.TryRefreshBacklogAsync(
            _ => Task.FromException<OutboxBacklogSnapshot>(new InvalidOperationException("telemetry query failed")),
            new DateTimeOffset(2026, 8, 1, 12, 0, 0, TimeSpan.Zero));

        await action.Should().NotThrowAsync();
    }

    private static MeterListener CreateMeterListener(ConcurrentBag<CapturedMeasurement> measurements)
    {
        var listener = new MeterListener();
        listener.InstrumentPublished = (instrument, meterListener) =>
        {
            if (instrument.Meter.Name == BitFinanceTelemetry.MeterName)
            {
                meterListener.EnableMeasurementEvents(instrument);
            }
        };
        listener.SetMeasurementEventCallback<long>((instrument, value, tags, _) =>
            measurements.Add(CapturedMeasurement.Create(instrument, value, tags)));
        listener.SetMeasurementEventCallback<double>((instrument, value, tags, _) =>
            measurements.Add(CapturedMeasurement.Create(instrument, value, tags)));
        listener.Start();
        return listener;
    }

    private static ActivityListener CreateActivityListener(ConcurrentBag<Activity> activities)
    {
        var listener = new ActivityListener
        {
            ShouldListenTo = source => source.Name == BitFinanceTelemetry.ActivitySourceName,
            Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
            ActivityStopped = activities.Add
        };
        ActivitySource.AddActivityListener(listener);
        return listener;
    }

    private sealed record CapturedMeasurement(
        string Name,
        string? Unit,
        double Value,
        IReadOnlyDictionary<string, object?> Tags)
    {
        public string? Tag(string name) => Tags.TryGetValue(name, out var value) ? value?.ToString() : null;

        public static CapturedMeasurement Create<T>(
            Instrument instrument,
            T value,
            ReadOnlySpan<KeyValuePair<string, object?>> tags) where T : struct =>
            new(
                instrument.Name,
                instrument.Unit,
                Convert.ToDouble(value),
                tags.ToArray().ToDictionary(tag => tag.Key, tag => tag.Value));
    }
}
