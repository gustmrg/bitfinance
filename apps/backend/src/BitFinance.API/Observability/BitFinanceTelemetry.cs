using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace BitFinance.API.Observability;

public static class BitFinanceTelemetry
{
    public const string ActivitySourceName = "BitFinance.API";
    public const string MeterName = "BitFinance.API";

    public static readonly ActivitySource ActivitySource = new(ActivitySourceName, typeof(BitFinanceTelemetry).Assembly.GetName().Version?.ToString(3));
    public static readonly Meter Meter = new(MeterName, typeof(BitFinanceTelemetry).Assembly.GetName().Version?.ToString(3));
}
