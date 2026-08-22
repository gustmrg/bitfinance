using BitFinance.Cli.Configuration;
using BitFinance.Cli.Errors;
using BitFinance.Cli.Output;
using System.CommandLine;

namespace BitFinance.Cli;

public sealed class CliApplication
{
    private static readonly string[] HelpOptions = ["--help", "-h", "-?", "/?"];
    private readonly RootCommand _rootCommand;
    private readonly CliOutputWriter _output;

    public CliApplication(IEnvironmentVariables environment, TextWriter standardOutput, TextWriter standardError)
    {
        ArgumentNullException.ThrowIfNull(environment);
        ArgumentNullException.ThrowIfNull(standardOutput);
        ArgumentNullException.ThrowIfNull(standardError);

        _output = new CliOutputWriter(standardOutput, standardError);
        Services = new CliServices(environment, _output);
        _rootCommand = CliCommandFactory.Create(Services);
    }

    public CliServices Services { get; }

    public static CliApplication CreateDefault() =>
        new(new SystemEnvironmentVariables(), Console.Out, Console.Error);

    public async Task<int> RunAsync(string[] args, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(args);

        var parseResult = _rootCommand.Parse(args);
        var invokesBuiltInAction = args.Contains("--version", StringComparer.Ordinal)
            || args.Any(argument => HelpOptions.Contains(argument, StringComparer.Ordinal));

        if (parseResult.Errors.Count > 0 && !invokesBuiltInAction)
        {
            var message = string.Join(" ", parseResult.Errors.Select(error => error.Message));
            _output.WriteError(CliError.InvalidArguments(message));
            return ExitCodes.InvalidInput;
        }

        var invocationConfiguration = new InvocationConfiguration
        {
            EnableDefaultExceptionHandler = false,
            Output = Services.Output.StandardOutput,
            Error = Services.Output.StandardError
        };

        try
        {
            return await parseResult.InvokeAsync(invocationConfiguration, cancellationToken);
        }
        catch (CliException exception)
        {
            _output.WriteError(exception.Error);
            return exception.ExitCode;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _output.WriteError(CliError.Cancelled());
            return ExitCodes.Cancelled;
        }
        catch (TaskCanceledException)
        {
            _output.WriteError(CliError.Transport("The BitFinance request timed out."));
            return ExitCodes.TransportFailure;
        }
        catch (HttpRequestException)
        {
            _output.WriteError(CliError.Transport("The BitFinance API could not be reached."));
            return ExitCodes.TransportFailure;
        }
        catch (Exception)
        {
            _output.WriteError(CliError.Unexpected());
            return ExitCodes.UnexpectedFailure;
        }
    }
}

public sealed record CliServices(IEnvironmentVariables Environment, CliOutputWriter Output);
