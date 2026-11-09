namespace BitFinance.MCP.Observability;

public sealed class ObservabilityOptions
{
    public const string SectionName = "Observability";

    public bool Enabled { get; set; }

    public string? Environment { get; set; }

    public double TraceSamplingRatio { get; set; } = 1.0;
}
