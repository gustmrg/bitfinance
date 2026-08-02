using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using BitFinance.MCP.Observability;
using Xunit;

namespace BitFinance.MCP.UnitTests;

[Collection(TelemetryTestCollection.Name)]
public sealed class McpToolTelemetryFilterTests
{
    [Fact]
    public async Task EveryRegisteredTool_PreservesResultAndUsesOnlyBoundedTelemetry()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        var activities = new ConcurrentBag<CapturedActivity>();
        using var meterListener = CreateMeterListener(measurements);
        using var activityListener = CreateActivityListener(activities);
        const string resultSentinel = "otel-secret-response-body";

        foreach (var toolName in McpToolTelemetryFilter.ToolNames)
        {
            var result = await McpToolTelemetryFilter.ExecuteAsync(
                toolName,
                () => ValueTask.FromResult(resultSentinel));
            Assert.Equal(resultSentinel, result);
        }

        Assert.NotEmpty(McpToolTelemetryFilter.ToolNames);
        var invocations = measurements
            .Where(item => item.Name == "bitfinance.mcp.tool.invocation.count")
            .ToList();
        Assert.Equal(McpToolTelemetryFilter.ToolNames.Count, invocations.Count);
        Assert.All(invocations, measurement =>
        {
            Assert.Equal("success", measurement.Tag("outcome"));
            var toolName = Assert.IsType<string>(measurement.Tag("mcp.tool.name"));
            Assert.Contains(toolName, McpToolTelemetryFilter.ToolNames);
            Assert.Equal(2, measurement.Tags.Count);
        });
        Assert.All(
            measurements.Where(item => item.Name == "bitfinance.mcp.tool.duration"),
            measurement =>
            {
                Assert.True(measurement.Value >= 0);
                Assert.Equal("s", measurement.Unit);
            });
        Assert.All(activities, activity =>
        {
            Assert.Equal("mcp.tool", activity.DisplayName);
            Assert.Equal(["mcp.tool.name", "outcome"], activity.Tags.Keys.Order().ToArray());
            Assert.Empty(activity.Events);
        });
        Assert.DoesNotContain(resultSentinel, Serialize(measurements, activities), StringComparison.Ordinal);
    }

    [Fact]
    public async Task ErrorAndCancellation_AreCountedOnceAndOriginalExceptionsArePreserved()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var meterListener = CreateMeterListener(measurements);
        var toolName = McpToolTelemetryFilter.ToolNames.First();
        var failure = new InvalidOperationException("tool failed");
        var cancellation = new OperationCanceledException();

        var thrownFailure = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            await McpToolTelemetryFilter.ExecuteAsync<string>(
                toolName,
                () => ValueTask.FromException<string>(failure)));
        var thrownCancellation = await Assert.ThrowsAsync<OperationCanceledException>(async () =>
            await McpToolTelemetryFilter.ExecuteAsync<string>(
                toolName,
                () => ValueTask.FromException<string>(cancellation)));

        Assert.Same(failure, thrownFailure);
        Assert.Same(cancellation, thrownCancellation);
        var invocations = measurements
            .Where(item => item.Name == "bitfinance.mcp.tool.invocation.count")
            .ToList();
        Assert.Equal(2, invocations.Count);
        Assert.Equal(
            ["cancelled", "error"],
            invocations.Select(item => item.Tag("outcome")).OfType<string>().Order().ToArray());
    }

    [Fact]
    public async Task Cardinality_DoesNotGrowWithClientControlledValues()
    {
        var measurements = new ConcurrentBag<CapturedMeasurement>();
        using var meterListener = CreateMeterListener(measurements);
        var values = new[]
        {
            "0198f438-5a25-7000-8000-000000000001",
            "otel-secret-email@example.invalid",
            "123456.78",
            "search=otel-secret-query"
        };

        foreach (var value in values)
        {
            await McpToolTelemetryFilter.ExecuteAsync(
                "client-controlled-" + value,
                () => ValueTask.FromResult(value));
        }

        var series = measurements
            .Where(item => item.Name == "bitfinance.mcp.tool.invocation.count")
            .Select(item => $"{item.Tag("mcp.tool.name")}|{item.Tag("outcome")}")
            .Distinct(StringComparer.Ordinal)
            .ToList();
        Assert.Equal(["unknown|success"], series);
        Assert.DoesNotContain(values, value => Serialize(measurements, []).Contains(value, StringComparison.Ordinal));
    }

    private static MeterListener CreateMeterListener(ConcurrentBag<CapturedMeasurement> measurements)
    {
        var listener = new MeterListener();
        listener.InstrumentPublished = (instrument, meterListener) =>
        {
            if (instrument.Meter.Name == BitFinanceMcpTelemetry.MeterName)
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

    private static ActivityListener CreateActivityListener(ConcurrentBag<CapturedActivity> activities)
    {
        var listener = new ActivityListener
        {
            ShouldListenTo = source => source.Name == BitFinanceMcpTelemetry.ActivitySourceName,
            Sample = static (ref ActivityCreationOptions<ActivityContext> _) => ActivitySamplingResult.AllData,
            ActivityStopped = activity => activities.Add(new(
                activity.DisplayName,
                activity.TagObjects.ToDictionary(tag => tag.Key, tag => tag.Value),
                activity.Events.ToArray()))
        };
        ActivitySource.AddActivityListener(listener);
        return listener;
    }

    private static string Serialize(
        IEnumerable<CapturedMeasurement> measurements,
        IEnumerable<CapturedActivity> activities) =>
        string.Join(' ', measurements.SelectMany(item => item.Tags).Select(tag => $"{tag.Key}={tag.Value}")) +
        string.Join(' ', activities.SelectMany(item => item.Tags).Select(tag => $"{tag.Key}={tag.Value}"));

    private sealed record CapturedActivity(
        string DisplayName,
        IReadOnlyDictionary<string, object?> Tags,
        IReadOnlyCollection<ActivityEvent> Events);

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
