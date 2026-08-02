using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using BitFinance.API.Extensions;
using BitFinance.API.Observability;
using FluentAssertions;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Xunit;

namespace BitFinance.API.UnitTests;

public sealed class ObservabilityConfigurationTests
{
    [Fact]
    public void EnabledExport_RequiresValidOtlpEndpoint()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration["Observability:Enabled"] = "true";
        builder.Configuration["OTEL_EXPORTER_OTLP_PROTOCOL"] = "grpc";

        var action = () => builder.AddBitFinanceObservability();

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*OTEL_EXPORTER_OTLP_ENDPOINT*");
    }

    [Fact]
    public void SamplingRatio_OutsideRange_IsRejectedAtStartup()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration["Observability:TraceSamplingRatio"] = "1.01";

        var action = () => builder.AddBitFinanceObservability();

        action.Should().Throw<InvalidOperationException>()
            .WithMessage("*TraceSamplingRatio*");
    }

    [Fact]
    public void Resource_UsesExpectedServiceIdentity()
    {
        var attributes = ObservabilityExtensions
            .CreateResourceBuilder("test", typeof(ObservabilityExtensions).Assembly)
            .Build()
            .Attributes
            .ToDictionary(attribute => attribute.Key, attribute => attribute.Value);

        attributes["service.name"].Should().Be("bitfinance-api");
        attributes["service.namespace"].Should().Be("bitfinance");
        attributes["service.version"].Should().Be("1.12.0");
        attributes["deployment.environment.name"].Should().Be("test");
        attributes["service.instance.id"].Should().NotBeNull();
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public void HealthRoutes_AreExcludedFromTracing(string path)
    {
        ObservabilityExtensions.IsHealthPath(path).Should().BeTrue();
        ObservabilityExtensions.IsHealthPath($"{path}/other").Should().BeFalse();
    }

    [Fact]
    public void PrivacyProcessor_RemovesSensitiveTraceAttributes()
    {
        using var activity = new Activity("SELECT 'otel-secret-response-body'").Start();
        activity.SetTag("user.email", "otel-secret-email@example.invalid");
        activity.SetTag("http.request.header.authorization", "Bearer otel-secret-token");
        activity.SetTag("url.query", "search=otel-secret-query");
        activity.SetTag("db.statement", "SELECT 'otel-secret-response-body'");
        activity.SetStatus(ActivityStatusCode.Error, "otel-secret-response-body");

        new TelemetryPrivacyProcessor().OnEnd(activity);

        var exported = string.Join(' ',
            activity.TagObjects.Select(tag => $"{tag.Key}={tag.Value}")
                .Append(activity.DisplayName)
                .Append(activity.StatusDescription));
        exported.Should().NotContain("Bearer otel-secret-token");
        exported.Should().NotContain("search=otel-secret-query");
        exported.Should().NotContain("otel-secret-response-body");
        exported.Should().NotContain("otel-secret-email@example.invalid");
    }

    [Fact]
    public void OpenTelemetryLogs_IncludeCurrentTraceAndSpan()
    {
        var exporter = new InMemoryLogExporter();
        using var tracerProvider = Sdk.CreateTracerProviderBuilder()
            .AddSource("bitfinance-tests")
            .Build();
        using var loggerFactory = LoggerFactory.Create(logging =>
            logging.AddOpenTelemetry(options =>
            {
                options.IncludeScopes = true;
                options.ParseStateValues = true;
                options.AddProcessor(new SimpleLogRecordExportProcessor(exporter));
            }));
        var logger = loggerFactory.CreateLogger<ObservabilityConfigurationTests>();
        using var source = new ActivitySource("bitfinance-tests");
        using var activity = source.StartActivity("operation");

        logger.LogInformation("Safe event {Outcome}", "success");
        loggerFactory.Dispose();

        var record = exporter.Records.Should().ContainSingle().Subject;
        record.TraceId.Should().Be(activity!.TraceId);
        record.SpanId.Should().Be(activity.SpanId);
    }

    [Fact]
    public void RuntimeMetrics_ArePublishedWithLowCardinalityInstrumentNames()
    {
        var meters = new ConcurrentBag<string>();
        using var listener = new MeterListener();
        listener.InstrumentPublished = (instrument, meterListener) =>
        {
            meters.Add(instrument.Meter.Name);
            meterListener.EnableMeasurementEvents(instrument);
        };
        listener.Start();

        using var provider = Sdk.CreateMeterProviderBuilder()
            .AddRuntimeInstrumentation()
            .Build();

        meters.Should().Contain("System.Runtime");
    }

    private sealed class InMemoryLogExporter : BaseExporter<LogRecord>
    {
        public ConcurrentBag<CapturedLogRecord> Records { get; } = [];

        public override ExportResult Export(in Batch<LogRecord> batch)
        {
            foreach (var record in batch)
            {
                Records.Add(new(record.TraceId, record.SpanId));
            }

            return ExportResult.Success;
        }
    }

    private sealed record CapturedLogRecord(ActivityTraceId TraceId, ActivitySpanId SpanId);
}
