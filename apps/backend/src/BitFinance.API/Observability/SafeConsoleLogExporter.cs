using System.Text.Json;
using OpenTelemetry;
using OpenTelemetry.Logs;

namespace BitFinance.API.Observability;

// A single sanitized logging pipeline prevents the console/CI from bypassing
// the privacy processor used by the external exporter.
public sealed class SafeConsoleLogExporter(bool development, TextWriter? writer = null) : BaseExporter<LogRecord>
{
    private readonly TextWriter _writer = writer ?? Console.Error;
    private readonly object _sync = new();

    public override ExportResult Export(in Batch<LogRecord> batch)
    {
        lock (_sync)
        {
            foreach (var record in batch)
            {
                var attributes = record.Attributes?.ToDictionary(pair => pair.Key, pair => pair.Value);
                var text = development
                    ? $"{record.Timestamp:O} {record.LogLevel} {record.CategoryName}: {record.Body} {JsonSerializer.Serialize(attributes)} trace={record.TraceId} span={record.SpanId}"
                    : JsonSerializer.Serialize(new
                    {
                        Timestamp = record.Timestamp,
                        Level = record.LogLevel.ToString(),
                        Category = record.CategoryName,
                        EventId = record.EventId.Id,
                        Message = record.Body,
                        TraceId = record.TraceId.ToString(),
                        SpanId = record.SpanId.ToString(),
                        Attributes = attributes
                    });
                _writer.WriteLine(text);
            }
        }
        return ExportResult.Success;
    }
}
