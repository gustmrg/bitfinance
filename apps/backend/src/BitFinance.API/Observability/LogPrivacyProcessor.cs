using OpenTelemetry;
using OpenTelemetry.Logs;

namespace BitFinance.API.Observability;

// Both console and OTLP export consume this sanitized record. Framework error
// messages (including EF SQL) and exception messages are never exported.
public sealed class LogPrivacyProcessor : BaseProcessor<LogRecord>
{
    private static readonly HashSet<string> CountAttributes = new(StringComparer.Ordinal)
    {
        "Count", "BillCount", "TotalBills", "TotalGenerated", "OrgCount"
    };

    public override void OnEnd(LogRecord record)
    {
        var isApplication = record.CategoryName?.StartsWith("BitFinance.", StringComparison.Ordinal) == true;
        var attributes = new List<KeyValuePair<string, object?>>();
        string? template = null;
        foreach (var attribute in record.Attributes ?? [])
        {
            if (isApplication && attribute.Key == "{OriginalFormat}")
                template = attribute.Value as string;
            else if (isApplication && CountAttributes.Contains(attribute.Key) && attribute.Value is int or long)
                attributes.Add(attribute);
        }

        if (record.Exception is { } exception)
            attributes.Add(new("exception.type", exception.GetType().FullName));

        // Application messages must use constant templates, never interpolation.
        record.Body = isApplication && template is not null ? template : "Diagnostic event (details redacted).";
        record.FormattedMessage = null;
        record.Exception = null;
        record.Attributes = attributes;
    }
}
