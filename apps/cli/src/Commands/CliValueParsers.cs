using BitFinance.Cli.Errors;
using System.Globalization;

namespace BitFinance.Cli.Commands;

internal static class CliValueParsers
{
    public static DateTimeOffset? ParseOptionalDate(string? value, string optionName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!DateTimeOffset.TryParse(
                value,
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var parsed))
        {
            throw CliException.InvalidArguments($"{optionName} must be an ISO 8601 date and time with an offset.");
        }

        return parsed;
    }

    public static void ValidateDateRange(DateTimeOffset? from, DateTimeOffset? to)
    {
        if (from.HasValue && to.HasValue && from.Value > to.Value)
        {
            throw CliException.InvalidArguments("--from must be earlier than or equal to --to.");
        }
    }
}
