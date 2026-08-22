namespace BitFinance.Cli.Errors;

public sealed record CliError(string Code, string Message, int? HttpStatus = null, object? Details = null)
{
    public static CliError InvalidArguments(string message) =>
        new("invalid_arguments", message);

    public static CliError Configuration(string message) =>
        new("invalid_configuration", message);

    public static CliError Transport(string message) =>
        new("transport_error", message);

    public static CliError Cancelled() =>
        new("cancelled", "The operation was cancelled.");

    public static CliError Unexpected() =>
        new("unexpected_error", "An unexpected error occurred.");
}

public sealed record CliErrorEnvelope(CliError Error);
