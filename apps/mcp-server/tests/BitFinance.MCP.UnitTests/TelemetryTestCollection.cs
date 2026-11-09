using Xunit;

namespace BitFinance.MCP.UnitTests;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class TelemetryTestCollection
{
    public const string Name = "Telemetry";
}
