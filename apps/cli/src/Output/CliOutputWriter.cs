using BitFinance.Cli.Errors;
using System.Text.Json;

namespace BitFinance.Cli.Output;

public sealed class CliOutputWriter
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        WriteIndented = false
    };

    public CliOutputWriter(TextWriter standardOutput, TextWriter standardError)
    {
        StandardOutput = standardOutput ?? throw new ArgumentNullException(nameof(standardOutput));
        StandardError = standardError ?? throw new ArgumentNullException(nameof(standardError));
    }

    public TextWriter StandardOutput { get; }

    public TextWriter StandardError { get; }

    public void WriteSuccess<T>(T value, OutputFormat format, TableData? table = null)
    {
        if (format == OutputFormat.Table)
        {
            if (table is not null)
            {
                WriteRows(table.Headers.ToArray(), table.Rows.Select(row => row.ToArray()).ToArray());
            }
            else
            {
                WriteTable(JsonSerializer.SerializeToElement(value, JsonOptions));
            }

            return;
        }

        StandardOutput.WriteLine(JsonSerializer.Serialize(value, JsonOptions));
    }

    public void WriteError(CliError error) =>
        StandardError.WriteLine(JsonSerializer.Serialize(new CliErrorEnvelope(error), JsonOptions));

    private void WriteTable(JsonElement element)
    {
        switch (element.ValueKind)
        {
            case JsonValueKind.Array:
                WriteArrayTable(element);
                break;
            case JsonValueKind.Object:
                WriteObjectTable(element);
                break;
            default:
                StandardOutput.WriteLine(RenderCell(element));
                break;
        }
    }

    private void WriteArrayTable(JsonElement array)
    {
        var items = array.EnumerateArray().ToArray();
        if (items.Length == 0)
        {
            StandardOutput.WriteLine("(no results)");
            return;
        }

        if (items.Any(item => item.ValueKind != JsonValueKind.Object))
        {
            WriteRows(["Value"], items.Select(item => new[] { RenderCell(item) }).ToArray());
            return;
        }

        var headers = items
            .SelectMany(item => item.EnumerateObject().Select(property => property.Name))
            .Distinct(StringComparer.Ordinal)
            .ToArray();
        var rows = items
            .Select(item => headers
                .Select(header => item.TryGetProperty(header, out var value) ? RenderCell(value) : string.Empty)
                .ToArray())
            .ToArray();

        WriteRows(headers, rows);
    }

    private void WriteObjectTable(JsonElement value)
    {
        var rows = value
            .EnumerateObject()
            .Select(property => new[] { property.Name, RenderCell(property.Value) })
            .ToArray();

        WriteRows(["Field", "Value"], rows);
    }

    private void WriteRows(string[] headers, string[][] rows)
    {
        if (rows.Length == 0)
        {
            StandardOutput.WriteLine("(no results)");
            return;
        }

        var widths = headers.Select(header => header.Length).ToArray();
        foreach (var row in rows)
        {
            for (var index = 0; index < row.Length; index++)
            {
                widths[index] = Math.Max(widths[index], row[index].Length);
            }
        }

        WriteRow(headers, widths);
        WriteRow(widths.Select(width => new string('-', width)).ToArray(), widths);
        foreach (var row in rows)
        {
            WriteRow(row, widths);
        }
    }

    private void WriteRow(string[] values, int[] widths) =>
        StandardOutput.WriteLine(string.Join("  ", values.Select((value, index) => value.PadRight(widths[index]))).TrimEnd());

    private static string RenderCell(JsonElement value)
    {
        var rendered = value.ValueKind switch
        {
            JsonValueKind.String => value.GetString() ?? string.Empty,
            JsonValueKind.Null or JsonValueKind.Undefined => string.Empty,
            JsonValueKind.True => "true",
            JsonValueKind.False => "false",
            _ => value.GetRawText()
        };

        return rendered.Replace('\r', ' ').Replace('\n', ' ');
    }
}
