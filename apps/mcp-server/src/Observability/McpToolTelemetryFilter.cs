using System.Diagnostics;
using System.Diagnostics.Metrics;
using System.Reflection;
using BitFinance.MCP.Tools;
using ModelContextProtocol.Protocol;
using ModelContextProtocol.Server;

namespace BitFinance.MCP.Observability;

public static class McpToolTelemetryFilter
{
    private static readonly Histogram<double> Duration = BitFinanceMcpTelemetry.Meter.CreateHistogram<double>(
        "bitfinance.mcp.tool.duration",
        unit: "s",
        description: "Duration of an MCP tool invocation.");
    private static readonly Counter<long> InvocationCount = BitFinanceMcpTelemetry.Meter.CreateCounter<long>(
        "bitfinance.mcp.tool.invocation.count",
        unit: "{invocation}",
        description: "Number of MCP tool invocations.");
    private static readonly HashSet<string> RegisteredToolNames = typeof(BitFinanceTools)
        .GetMethods(BindingFlags.Instance | BindingFlags.Public | BindingFlags.DeclaredOnly)
        .Where(method => method.GetCustomAttribute<McpServerToolAttribute>() is not null)
        .Select(method => method.Name)
        .ToHashSet(StringComparer.Ordinal);

    public static IReadOnlySet<string> ToolNames => RegisteredToolNames;

    public static McpRequestFilter<CallToolRequestParams, CallToolResult> Create() => next =>
        (request, cancellationToken) => ExecuteAsync(
            request.Params?.Name,
            () => next(request, cancellationToken),
            cancellationToken);

    public static async ValueTask<T> ExecuteAsync<T>(
        string? requestedToolName,
        Func<ValueTask<T>> operation,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(operation);

        var toolName = NormalizeToolName(requestedToolName);
        var startedAt = Stopwatch.GetTimestamp();
        var activity = StartActivitySafely(toolName);
        var outcome = "success";

        try
        {
            return await operation();
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
            RecordSafely(toolName, outcome, Stopwatch.GetElapsedTime(startedAt).TotalSeconds);
        }
    }

    public static string NormalizeToolName(string? requestedToolName) =>
        requestedToolName is not null && RegisteredToolNames.Contains(requestedToolName)
            ? requestedToolName
            : "unknown";

    private static void RecordSafely(string toolName, string outcome, double durationSeconds)
    {
        try
        {
            var tags = new TagList
            {
                { "mcp.tool.name", toolName },
                { "outcome", outcome }
            };
            Duration.Record(durationSeconds, tags);
            InvocationCount.Add(1, tags);
        }
        catch
        {
            // Telemetry is best-effort and must never change tool behavior.
        }
    }

    private static Activity? StartActivitySafely(string toolName)
    {
        try
        {
            var activity = BitFinanceMcpTelemetry.ActivitySource.StartActivity("mcp.tool", ActivityKind.Internal);
            activity?.SetTag("mcp.tool.name", toolName);
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
