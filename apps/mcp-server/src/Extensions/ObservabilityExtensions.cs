using System.Diagnostics;
using System.Reflection;
using BitFinance.MCP.Observability;
using OpenTelemetry;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace BitFinance.MCP.Extensions;

public static class ObservabilityExtensions
{
    public const string ServiceName = "bitfinance-mcp";
    public const string ServiceNamespace = "bitfinance";

    public static WebApplicationBuilder AddBitFinanceObservability(this WebApplicationBuilder builder)
    {
        Activity.DefaultIdFormat = ActivityIdFormat.W3C;
        Activity.ForceDefaultIdFormat = true;

        var settings = ResolveSettings(builder.Configuration, builder.Environment);
        var resource = CreateResourceBuilder(settings.Environment, typeof(Program).Assembly);

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resourceBuilder => resourceBuilder.AddAttributes(resource.Build().Attributes))
            .WithTracing(tracing =>
            {
                tracing
                    .SetSampler(new ParentBasedSampler(new TraceIdRatioBasedSampler(settings.TraceSamplingRatio)))
                    .AddSource(BitFinanceMcpTelemetry.ActivitySourceName)
                    .AddProcessor(new TelemetryPrivacyProcessor())
                    .AddAspNetCoreInstrumentation(options =>
                    {
                        options.Filter = context => !IsHealthPath(context.Request.Path);
                        options.RecordException = false;
                    })
                    .AddHttpClientInstrumentation(options =>
                    {
                        options.FilterHttpRequestMessage = request =>
                            request.RequestUri is null || !IsHealthPath(request.RequestUri.AbsolutePath);
                        options.RecordException = false;
                    });

                if (settings.ExportEnabled)
                {
                    tracing.AddOtlpExporter(options => ConfigureExporter(options, settings, "traces"));
                }
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .AddMeter(BitFinanceMcpTelemetry.MeterName)
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddView(_ => new MetricStreamConfiguration { TagKeys = MetricTagKeys });

                if (settings.ExportEnabled)
                {
                    metrics.AddOtlpExporter(options => ConfigureExporter(options, settings, "metrics"));
                }
            });

        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.SetResourceBuilder(resource);
            // ASP.NET request scopes contain raw paths and user identifiers.
            logging.IncludeScopes = false;
            logging.IncludeFormattedMessage = false;
            logging.ParseStateValues = true;
            logging.AddProcessor(new LogPrivacyProcessor());
            logging.AddProcessor(new SimpleLogRecordExportProcessor(
                new SafeConsoleLogExporter(builder.Environment.IsDevelopment())));

            if (settings.ExportEnabled)
            {
                logging.AddOtlpExporter(options => ConfigureExporter(options, settings, "logs"));
            }
        });

        return builder;
    }

    public static ResourceBuilder CreateResourceBuilder(string environment, Assembly assembly) =>
        ResourceBuilder.CreateDefault().AddService(
            serviceName: ServiceName,
            serviceNamespace: ServiceNamespace,
            serviceVersion: assembly.GetName().Version?.ToString(3) ?? "unknown",
            serviceInstanceId: Environment.MachineName)
        .AddAttributes([
            new KeyValuePair<string, object>("deployment.environment.name", environment)
        ]);

    public static bool IsHealthPath(PathString path) => IsHealthPath(path.Value);

    public static bool IsHealthPath(string? path) =>
        string.Equals(path?.TrimEnd('/'), "/health", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(path?.TrimEnd('/'), "/health/live", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(path?.TrimEnd('/'), "/health/ready", StringComparison.OrdinalIgnoreCase);

    private static ResolvedObservabilitySettings ResolveSettings(
        IConfiguration configuration,
        IHostEnvironment hostEnvironment)
    {
        var options = configuration.GetSection(ObservabilityOptions.SectionName).Get<ObservabilityOptions>() ?? new();
        var environment = string.IsNullOrWhiteSpace(options.Environment)
            ? hostEnvironment.EnvironmentName.ToLowerInvariant()
            : options.Environment.Trim().ToLowerInvariant();

        if (!double.IsFinite(options.TraceSamplingRatio) || options.TraceSamplingRatio is < 0 or > 1)
        {
            throw new InvalidOperationException("Observability:TraceSamplingRatio must be between 0 and 1.");
        }

        if (!options.Enabled)
        {
            return new(false, environment, options.TraceSamplingRatio, null, OpenTelemetry.Exporter.OtlpExportProtocol.Grpc);
        }

        var endpointValue = configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
        if (!Uri.TryCreate(endpointValue, UriKind.Absolute, out var endpoint) ||
            endpoint.Scheme is not ("http" or "https"))
        {
            throw new InvalidOperationException(
                "OTEL_EXPORTER_OTLP_ENDPOINT must be an absolute HTTP or HTTPS URL when observability export is enabled.");
        }

        var protocol = ParseProtocol(configuration["OTEL_EXPORTER_OTLP_PROTOCOL"]);
        return new(true, environment, options.TraceSamplingRatio, endpoint, protocol);
    }

    private static OpenTelemetry.Exporter.OtlpExportProtocol ParseProtocol(string? value) =>
        value?.Trim().ToLowerInvariant() switch
        {
            "grpc" => OpenTelemetry.Exporter.OtlpExportProtocol.Grpc,
            "http/protobuf" => OpenTelemetry.Exporter.OtlpExportProtocol.HttpProtobuf,
            _ => throw new InvalidOperationException(
                "OTEL_EXPORTER_OTLP_PROTOCOL must be 'grpc' or 'http/protobuf' when observability export is enabled.")
        };

    private static readonly string[] MetricTagKeys =
    [
        "http.request.method", "http.response.status_code", "http.route",
        "server.address", "server.port", "url.scheme", "network.protocol.version",
        "error.type", "db.system.name", "state", "db.client.connection.state",
        "dotnet.gc.heap.generation", "dotnet.gc.collection.generation",
        "dotnet.gc.collection.reason", "dotnet.gc.collection.type",
        "cpu.mode", "gc.heap.generation", "worker.name", "outcome", "mcp.tool.name"
    ];

    private static void ConfigureExporter(
        OpenTelemetry.Exporter.OtlpExporterOptions exporter,
        ResolvedObservabilitySettings settings,
        string signal)
    {
        exporter.Endpoint = settings.Protocol == OpenTelemetry.Exporter.OtlpExportProtocol.HttpProtobuf
            ? new Uri($"{settings.Endpoint!.AbsoluteUri.TrimEnd('/')}/v1/{signal}")
            : settings.Endpoint!;
        exporter.Protocol = settings.Protocol;
    }

    private sealed record ResolvedObservabilitySettings(
        bool ExportEnabled,
        string Environment,
        double TraceSamplingRatio,
        Uri? Endpoint,
        OpenTelemetry.Exporter.OtlpExportProtocol Protocol);
}
