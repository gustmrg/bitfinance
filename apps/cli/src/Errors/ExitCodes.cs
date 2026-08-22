namespace BitFinance.Cli.Errors;

public static class ExitCodes
{
    public const int Success = 0;
    public const int UnexpectedFailure = 1;
    public const int InvalidInput = 2;
    public const int AuthenticationFailure = 3;
    public const int ApiFailure = 4;
    public const int TransportFailure = 5;
    public const int Cancelled = 130;
}
