using System.Globalization;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace BitFinance.MCP.Models;

/// <summary>
/// Reads calendar dates sent either as "yyyy-MM-dd" or as a timestamp ("yyyy-MM-ddTHH:mm:ss..."),
/// keeping the date exactly as written instead of shifting it through a time zone. Writes "yyyy-MM-dd".
/// </summary>
public sealed class CalendarDateJsonConverter : JsonConverter<DateOnly>
{
    private const string Format = "yyyy-MM-dd";

    public override DateOnly Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (value is null || value.Length < Format.Length ||
            !DateOnly.TryParseExact(value[..Format.Length], Format, CultureInfo.InvariantCulture, DateTimeStyles.None, out var date))
        {
            throw new JsonException($"Invalid calendar date: '{value}'.");
        }

        return date;
    }

    public override void Write(Utf8JsonWriter writer, DateOnly value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString(Format, CultureInfo.InvariantCulture));
    }
}

/// <summary>
/// Treats timestamps without an offset as UTC, which is how the BitFinance API stores them,
/// instead of applying the time zone of the machine running the MCP server.
/// </summary>
public sealed class UtcDateTimeOffsetJsonConverter : JsonConverter<DateTimeOffset>
{
    public override DateTimeOffset Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        var value = reader.GetString();
        if (!DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AssumeUniversal, out var dateTimeOffset))
        {
            throw new JsonException($"Invalid date/time: '{value}'.");
        }

        return dateTimeOffset;
    }

    public override void Write(Utf8JsonWriter writer, DateTimeOffset value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value);
    }
}
