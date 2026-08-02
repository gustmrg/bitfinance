using System.Diagnostics;
using System.Diagnostics.Metrics;

namespace BitFinance.API.Observability;

public static class BitFinanceTelemetry
{
    public const string ActivitySourceName = "BitFinance.API";
    public const string MeterName = "BitFinance.API";

    public static readonly ActivitySource ActivitySource = new(ActivitySourceName, "1.12.0");
    public static readonly Meter Meter = new(MeterName, "1.12.0");
}
