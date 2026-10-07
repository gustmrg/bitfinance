using System.Collections.Concurrent;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Net;
using System.Text;
using BitFinance.MCP.Extensions;
using BitFinance.MCP.Observability;
using Microsoft.AspNetCore.Builder;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Trace;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public sealed class ObservabilityConfigurationTests
{
    [Fact]
    public void EnabledExport_RequiresValidOtlpEndpoint()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration["Observability:Enabled"] = "true";
        builder.Configuration["OTEL_EXPORTER_OTLP_PROTOCOL"] = "grpc";

        var exception = Assert.Throws<InvalidOperationException>(
            () => builder.AddBitFinanceObservability());

        Assert.Contains("OTEL_EXPORTER_OTLP_ENDPOINT", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void SamplingRatio_OutsideRange_IsRejectedAtStartup()
    {
        var builder = WebApplication.CreateBuilder();
        builder.Configuration["Observability:TraceSamplingRatio"] = "-0.01";

        var exception = Assert.Throws<InvalidOperationException>(
            () => builder.AddBitFinanceObservability());

        Assert.Contains("TraceSamplingRatio", exception.Message, StringComparison.Ordinal);
    }

    [Fact]
    public void Resource_UsesExpectedServiceIdentity()
    {
        var attributes = ObservabilityExtensions
            .CreateResourceBuilder("test", typeof(ObservabilityExtensions).Assembly)
            .Build()
            .Attributes
            .ToDictionary(attribute => attribute.Key, attribute => attribute.Value);

        Assert.Equal("bitfinance-mcp", attributes["service.name"]);
        Assert.Equal("bitfinance", attributes["service.namespace"]);
        Assert.Equal("0.5.0", attributes["service.version"]);
        Assert.Equal("test", attributes["deployment.environment.name"]);
        Assert.NotNull(attributes["service.instance.id"]);
    }

    [Theory]
    [InlineData("/health")]
    [InlineData("/health/live")]
    [InlineData("/health/ready")]
    public void HealthRoutes_AreExcludedFromTracing(string path)
    {
        Assert.True(ObservabilityExtensions.IsHealthPath(path));
        Assert.False(ObservabilityExtensions.IsHealthPath($"{path}/other"));
    }

    [Fact]
    public void PrivacyProcessor_RemovesSensitiveHttpAttributes()
    {
        using var activity = new Activity("privacy-test").Start();
        activity.SetTag("http.request.header.authorization", "Bearer otel-secret-token");
        activity.SetTag("url.full", "https://example.invalid/?search=otel-secret-query");
        activity.SetTag("http.response.header.content", "otel-secret-response-body");
        activity.SetTag("url.path", "/otel-secret-email@example.invalid");
        activity.SetStatus(ActivityStatusCode.Error, "otel-secret-response-body");

        new TelemetryPrivacyProcessor().OnEnd(activity);

        var exported = string.Join(' ',
            activity.TagObjects.Select(tag => $"{tag.Key}={tag.Value}")
                .Append(activity.StatusDescription));
        Assert.DoesNotContain("Bearer otel-secret-token", exported);
        Assert.DoesNotContain("search=otel-secret-query", exported);
        Assert.DoesNotContain("otel-secret-response-body", exported);
        Assert.DoesNotContain("otel-secret-email@example.invalid", exported);
    }

    [Fact]
    public async Task HttpClient_PropagatesW3CTraceContextToApi()
    {
        await using var transport = new ControlledHttpTransport();
        using var handler = new SocketsHttpHandler
        {
            ConnectCallback = (_, _) => ValueTask.FromResult<Stream>(transport)
        };

        using var tracerProvider = Sdk.CreateTracerProviderBuilder()
            .AddSource("bitfinance-mcp-tests")
            .AddHttpClientInstrumentation()
            .Build();
        using var source = new ActivitySource("bitfinance-mcp-tests");
        using var incomingMcpActivity = source.StartActivity("mcp-request", ActivityKind.Server);
        using var client = new HttpClient(handler);

        await client.GetAsync("http://api.invalid/v1/expenses?search=otel-secret-query");

        var request = transport.GetRequest();
        var traceParent = request
            .Split("\r\n", StringSplitOptions.RemoveEmptyEntries)
            .SingleOrDefault(line => line.StartsWith("traceparent:", StringComparison.OrdinalIgnoreCase));

        Assert.NotNull(incomingMcpActivity);
        Assert.NotNull(traceParent);
        Assert.Contains(incomingMcpActivity.TraceId.ToString(), traceParent, StringComparison.Ordinal);
        Assert.DoesNotContain("otel-secret-query", traceParent, StringComparison.Ordinal);
    }

    [Fact]
    public void RuntimeMetrics_ArePublished()
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

        Assert.Contains("System.Runtime", meters);
    }

    private sealed class ControlledHttpTransport : Stream
    {
        private static readonly byte[] Response = Encoding.ASCII.GetBytes(
            "HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");

        private readonly MemoryStream request = new();
        private int responsePosition;

        public override bool CanRead => true;
        public override bool CanSeek => false;
        public override bool CanWrite => true;
        public override long Length => throw new NotSupportedException();

        public override long Position
        {
            get => throw new NotSupportedException();
            set => throw new NotSupportedException();
        }

        public string GetRequest() => Encoding.ASCII.GetString(request.ToArray());

        public override int Read(byte[] buffer, int offset, int count)
        {
            var bytesToCopy = Math.Min(count, Response.Length - responsePosition);
            if (bytesToCopy <= 0)
            {
                return 0;
            }

            Response.AsSpan(responsePosition, bytesToCopy).CopyTo(buffer.AsSpan(offset, bytesToCopy));
            responsePosition += bytesToCopy;
            return bytesToCopy;
        }

        public override ValueTask<int> ReadAsync(
            Memory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            var bytesToCopy = Math.Min(buffer.Length, Response.Length - responsePosition);
            if (bytesToCopy <= 0)
            {
                return ValueTask.FromResult(0);
            }

            Response.AsMemory(responsePosition, bytesToCopy).CopyTo(buffer);
            responsePosition += bytesToCopy;
            return ValueTask.FromResult(bytesToCopy);
        }

        public override void Write(byte[] buffer, int offset, int count) =>
            request.Write(buffer, offset, count);

        public override ValueTask WriteAsync(
            ReadOnlyMemory<byte> buffer,
            CancellationToken cancellationToken = default)
        {
            request.Write(buffer.Span);
            return ValueTask.CompletedTask;
        }

        public override void Flush()
        {
        }

        public override Task FlushAsync(CancellationToken cancellationToken) => Task.CompletedTask;

        public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();

        public override void SetLength(long value) => throw new NotSupportedException();

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                request.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
