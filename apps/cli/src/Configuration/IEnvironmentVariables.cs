namespace BitFinance.Cli.Configuration;

public interface IEnvironmentVariables
{
    string? Get(string name);
}

public sealed class SystemEnvironmentVariables : IEnvironmentVariables
{
    public string? Get(string name) => Environment.GetEnvironmentVariable(name);
}
