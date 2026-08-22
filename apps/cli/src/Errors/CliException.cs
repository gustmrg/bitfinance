namespace BitFinance.Cli.Errors;

public sealed class CliException : Exception
{
    public CliException(CliError error, int exitCode)
        : base(error.Message)
    {
        Error = error;
        ExitCode = exitCode;
    }

    public CliError Error { get; }

    public int ExitCode { get; }

    public static CliException Configuration(string message) =>
        new(CliError.Configuration(message), ExitCodes.InvalidInput);

    public static CliException InvalidArguments(string message) =>
        new(CliError.InvalidArguments(message), ExitCodes.InvalidInput);
}
