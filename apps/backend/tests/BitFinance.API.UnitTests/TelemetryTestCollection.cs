using Xunit;

namespace BitFinance.API.UnitTests;

[CollectionDefinition(Name, DisableParallelization = true)]
public sealed class TelemetryTestCollection
{
    public const string Name = "Telemetry";
}
