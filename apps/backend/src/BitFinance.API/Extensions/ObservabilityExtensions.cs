using System.Diagnostics;
using System.Reflection;
using BitFinance.API.Observability;
using Npgsql;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

namespace BitFinance.API.Extensions;

public static class ObservabilityExtensions
{
    public const string ServiceName = "bitfinance-api";
    public const string ServiceNamespace = "bitfinance";

    public static WebApplicationBuilder AddBitFinanceObservability(
        this WebApplicationBuilder builder,
        bool disableExport = false)
    {
        Activity.DefaultIdFormat = ActivityIdFormat.W3C;
        Activity.ForceDefaultIdFormat = true;

        var settings = ResolveSettings(builder.Configuration, builder.Environment, disableExport);
        var resource = CreateResourceBuilder(settings.Environment, typeof(Program).Assembly);

        builder.Services.AddOpenTelemetry()
            .ConfigureResource(resourceBuilder => resourceBuilder.AddAttributes(resource.Build().Attributes))
            .WithTracing(tracing =>
            {
                tracing
                    .SetSampler(new ParentBasedSampler(new TraceIdRatioBasedSampler(settings.TraceSamplingRatio)))
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
                    })
                    .AddNpgsql();

                if (settings.ExportEnabled)
                {
                    tracing.AddOtlpExporter(options => ConfigureExporter(options, settings));
                }
            })
            .WithMetrics(metrics =>
            {
                metrics
                    .AddAspNetCoreInstrumentation()
                    .AddHttpClientInstrumentation()
                    .AddRuntimeInstrumentation()
                    .AddNpgsqlInstrumentation();

                if (settings.ExportEnabled)
                {
                    metrics.AddOtlpExporter(options => ConfigureExporter(options, settings));
                }
            });

        builder.Logging.AddOpenTelemetry(logging =>
        {
            logging.SetResourceBuilder(resource);
            logging.IncludeScopes = true;
            logging.IncludeFormattedMessage = false;
            logging.ParseStateValues = true;

            if (settings.ExportEnabled)
            {
                logging.AddOtlpExporter(options => ConfigureExporter(options, settings));
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
        string.Equals(path, "/health", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(path, "/health/live", StringComparison.OrdinalIgnoreCase) ||
        string.Equals(path, "/health/ready", StringComparison.OrdinalIgnoreCase);

    private static ResolvedObservabilitySettings ResolveSettings(
        IConfiguration configuration,
        IHostEnvironment hostEnvironment,
        bool disableExport)
    {
        var options = configuration.GetSection(ObservabilityOptions.SectionName).Get<ObservabilityOptions>() ?? new();
        var environment = string.IsNullOrWhiteSpace(options.Environment)
            ? hostEnvironment.EnvironmentName.ToLowerInvariant()
            : options.Environment.Trim().ToLowerInvariant();

        if (options.TraceSamplingRatio is < 0 or > 1)
        {
            throw new InvalidOperationException("Observability:TraceSamplingRatio must be between 0 and 1.");
        }

        if (!options.Enabled || disableExport)
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

    private static void ConfigureExporter(
        OpenTelemetry.Exporter.OtlpExporterOptions exporter,
        ResolvedObservabilitySettings settings)
    {
        exporter.Endpoint = settings.Endpoint!;
        exporter.Protocol = settings.Protocol;
    }

    private sealed record ResolvedObservabilitySettings(
        bool ExportEnabled,
        string Environment,
        double TraceSamplingRatio,
        Uri? Endpoint,
        OpenTelemetry.Exporter.OtlpExportProtocol Protocol);
}
