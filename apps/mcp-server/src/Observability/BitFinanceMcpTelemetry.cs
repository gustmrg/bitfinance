using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace BitFinance.MCP.Observability;

public static class BitFinanceMcpTelemetry
{
    public const string ActivitySourceName = "BitFinance.MCP";
    public const string MeterName = "BitFinance.MCP";

    public static readonly ActivitySource ActivitySource = new(ActivitySourceName, typeof(BitFinanceMcpTelemetry).Assembly.GetName().Version?.ToString(3));
    public static readonly Meter Meter = new(MeterName, typeof(BitFinanceMcpTelemetry).Assembly.GetName().Version?.ToString(3));
}
