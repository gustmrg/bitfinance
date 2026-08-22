using BitFinance.Cli.Output;
using BitFinance.Cli.Commands;
using System.CommandLine;

namespace BitFinance.Cli;

public static class CliCommandFactory
{
    public static RootCommand Create(CliServices services)
    {
        ArgumentNullException.ThrowIfNull(services);

        var outputOption = new Option<OutputFormat>("--output")
        {
            Description = "Output format for successful command results.",
            DefaultValueFactory = _ => OutputFormat.Json,
            Recursive = true
        };

        var rootCommand = new RootCommand("Agent-oriented command-line client for BitFinance.");
        rootCommand.Options.Add(outputOption);
        ReadCommands.AddTo(rootCommand, services, outputOption);
        MutationCommands.AddTo(rootCommand, services, outputOption);

        return rootCommand;
    }
}
