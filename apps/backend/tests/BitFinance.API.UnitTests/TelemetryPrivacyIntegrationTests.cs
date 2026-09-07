using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Text.Json;
using BitFinance.API.Extensions;
using BitFinance.API.Observability;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using Xunit;

namespace BitFinance.API.UnitTests;

[Collection(TelemetryTestCollection.Name)]
public sealed class TelemetryPrivacyIntegrationTests
{
    [Fact]
    public void ConfiguredLogs_SanitizeExceptionsAttributesAndRequestScopesBeforeBothSinks()
    {
        var builder = WebApplication.CreateBuilder(new WebApplicationOptions { EnvironmentName = "Production" });
        builder.Logging.ClearProviders();
        builder.AddBitFinanceObservability();
        var exporter = new CapturingLogExporter();
        using var console = new StringWriter();
        builder.Logging.AddOpenTelemetry(options =>
        {
            options.AddProcessor(new SimpleLogRecordExportProcessor(new SafeConsoleLogExporter(false, console)));
            options.AddProcessor(new SimpleLogRecordExportProcessor(exporter));
        });
        using var app = builder.Build();
        var factory = app.Services.GetRequiredService<ILoggerFactory>();
        var logger = factory.CreateLogger("BitFinance.API.PrivacyTest");
        using var activity = new Activity("test").Start();
        using (logger.BeginScope(new Dictionary<string, object> { ["RequestPath"] = "/bills/otel-secret-id" }))
        {
            logger.LogError(new InvalidOperationException("otel-secret-exception"),
                "Operation failed {Email} {CommandText}", "otel-secret-email", "otel-secret-SQL");
        }
        factory.CreateLogger("Microsoft.EntityFrameworkCore.Database.Command").LogError(
            "Failed executing DbCommand {commandText}", "SELECT 'otel-secret-SQL'");

        Assert.DoesNotContain("otel-secret", string.Join(' ', exporter.Records));
        Assert.DoesNotContain("otel-secret", console.ToString());
        Assert.Contains("System.InvalidOperationException", console.ToString());
        Assert.Contains(activity.TraceId.ToString(), console.ToString());
        Assert.Contains(activity.SpanId.ToString(), console.ToString());
        Assert.Contains("Operation failed", console.ToString());
        Assert.Contains("Diagnostic event", console.ToString());
        Assert.Equal(2, exporter.Records.Count);
    }

    [Fact]
    public void ConfiguredMetrics_DropPoolConnectionStringsAndClientControlledDimensions()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Logging.ClearProviders();
        builder.AddBitFinanceObservability();
        var exporter = new CapturingMetricExporter();
        builder.Services.AddOpenTelemetry().WithMetrics(metrics =>
            metrics.AddReader(new BaseExportingMetricReader(exporter)));
        using var app = builder.Build();
        var provider = app.Services.GetRequiredService<MeterProvider>();
        using var meter = new Meter("BitFinance.API");
        var counter = meter.CreateCounter<long>("privacy.test.count");
        counter.Add(1, new TagList
        {
            { "db.client.connection.pool.name", "Host=otel-secret-host;Username=otel-secret-user" },
            { "user.id", "otel-secret-id" },
            { "outcome", "success" }
        });
        provider.ForceFlush();
        Assert.NotEmpty(exporter.Tags);
        Assert.DoesNotContain("otel-secret", string.Join(' ', exporter.Tags));
        Assert.Contains("outcome=success", exporter.Tags);
    }

    [Theory]
    [InlineData("NaN")]
    [InlineData("Infinity")]
    public void NonFiniteSamplingRatio_IsRejected(string value)
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration["Observability:TraceSamplingRatio"] = value;
        Assert.Throws<InvalidOperationException>(() => builder.AddBitFinanceObservability());
    }

    private sealed class CapturingLogExporter : BaseExporter<LogRecord>
    {
        public List<string> Records { get; } = [];
        public override ExportResult Export(in Batch<LogRecord> batch)
        {
            foreach (var record in batch)
            {
                var scopes = new List<string>();
                record.ForEachScope((scope, state) =>
                {
                    foreach (var attribute in scope) state.Add($"{attribute.Key}={attribute.Value}");
                }, scopes);
                Records.Add(JsonSerializer.Serialize(new { record.Body, record.FormattedMessage,
                    Exception = record.Exception?.ToString(), record.Attributes, Scopes = scopes }));
            }
            return ExportResult.Success;
        }
    }

    private sealed class CapturingMetricExporter : BaseExporter<Metric>
    {
        public List<string> Tags { get; } = [];
        public override ExportResult Export(in Batch<Metric> batch)
        {
            foreach (var metric in batch)
                foreach (ref readonly var point in metric.GetMetricPoints())
                    foreach (var tag in point.Tags) Tags.Add($"{tag.Key}={tag.Value}");
            return ExportResult.Success;
        }
    }
}
