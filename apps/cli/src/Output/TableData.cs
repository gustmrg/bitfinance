namespace BitFinance.Cli.Output;

public sealed record TableData(
    IReadOnlyList<string> Headers,
    IReadOnlyList<IReadOnlyList<string>> Rows);
