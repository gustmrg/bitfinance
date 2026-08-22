using BitFinance.Cli.Errors;
using System.Globalization;

namespace BitFinance.Cli.Commands;

internal static class CliValueParsers
{
    public static DateTimeOffset ParseRequiredDate(string value, string optionName) =>
        ParseOptionalDate(value, optionName)
        ?? throw CliException.InvalidArguments($"{optionName} is required.");

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

    public static decimal ParseRequiredDecimal(string value, string optionName) =>
        ParseOptionalDecimal(value, optionName)
        ?? throw CliException.InvalidArguments($"{optionName} is required.");

    public static decimal? ParseOptionalDecimal(string? value, string optionName)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        if (!decimal.TryParse(value, NumberStyles.Number, CultureInfo.InvariantCulture, out var parsed))
        {
            throw CliException.InvalidArguments($"{optionName} must be a decimal number using invariant formatting.");
        }

        return parsed;
    }

    public static void ValidateNotes(string? notes)
    {
        if (notes?.Length > 2000)
        {
            throw CliException.InvalidArguments("--notes must be 2,000 characters or fewer.");
        }
    }
}
