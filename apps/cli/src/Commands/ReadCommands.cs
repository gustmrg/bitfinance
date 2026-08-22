using BitFinance.Cli.Configuration;
using BitFinance.Cli.Models;
using BitFinance.Cli.Output;
using BitFinance.Cli.Services;
using System.CommandLine;

namespace BitFinance.Cli.Commands;

public static class ReadCommands
{
    public static void AddTo(
        RootCommand rootCommand,
        CliServices services,
        Option<OutputFormat> outputOption)
    {
        rootCommand.Subcommands.Add(BuildOrganizationsCommand(services, outputOption));
        rootCommand.Subcommands.Add(BuildDashboardCommand(services, outputOption));
        rootCommand.Subcommands.Add(BuildBillsCommand(services, outputOption));
        rootCommand.Subcommands.Add(BuildExpensesCommand(services, outputOption));
    }

    private static Command BuildOrganizationsCommand(
        CliServices services,
        Option<OutputFormat> outputOption)
    {
        var group = new Command("organizations", "Read BitFinance organizations.");
        var list = new Command("list", "List organizations accessible to the authenticated user.");
        SetReadAction(
            list,
            services,
            outputOption,
            (_, client, cancellationToken) => client.ListOrganizationsAsync(cancellationToken),
            ReadCommandTables.Organizations);

        var get = new Command("get", "Get one organization and its members.");
        var organizationOption = OrganizationOption();
        get.Options.Add(organizationOption);
        SetReadAction(
            get,
            services,
            outputOption,
            (result, client, cancellationToken) => client.GetOrganizationAsync(
                result.GetRequiredValue(organizationOption),
                cancellationToken),
            ReadCommandTables.Organization);

        group.Subcommands.Add(list);
        group.Subcommands.Add(get);
        return group;
    }

    private static Command BuildDashboardCommand(
        CliServices services,
        Option<OutputFormat> outputOption)
    {
        var group = new Command("dashboard", "Read BitFinance dashboard data.");

        var upcomingBills = new Command("upcoming-bills", "Get upcoming bills for an organization.");
        var upcomingOrganizationOption = OrganizationOption();
        upcomingBills.Options.Add(upcomingOrganizationOption);
        SetReadAction(
            upcomingBills,
            services,
            outputOption,
            (result, client, cancellationToken) => client.GetUpcomingBillsAsync(
                result.GetRequiredValue(upcomingOrganizationOption),
                cancellationToken),
            ReadCommandTables.UpcomingBills);

        var recentExpenses = new Command("recent-expenses", "Get recent expenses for an organization.");
        var recentOrganizationOption = OrganizationOption();
        recentExpenses.Options.Add(recentOrganizationOption);
        SetReadAction(
            recentExpenses,
            services,
            outputOption,
            (result, client, cancellationToken) => client.GetRecentExpensesAsync(
                result.GetRequiredValue(recentOrganizationOption),
                cancellationToken),
            ReadCommandTables.RecentExpenses);

        group.Subcommands.Add(upcomingBills);
        group.Subcommands.Add(recentExpenses);
        return group;
    }

    private static Command BuildBillsCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var group = new Command("bills", "Read BitFinance bills.");
        var list = new Command("list", "List bills for an organization.");
        var organizationOption = OrganizationOption();
        var pageOption = PositiveIntegerOption("--page", "Page number.", 1);
        var pageSizeOption = PositiveIntegerOption("--page-size", "Number of bills per page.", 100);
        var fromOption = OptionalStringOption("--from", "Inclusive ISO 8601 start date and time.");
        var toOption = OptionalStringOption("--to", "Inclusive ISO 8601 end date and time.");
        var statusOption = OptionalStringOption("--status", "Comma-separated bill statuses.");
        var descriptionOption = OptionalStringOption("--description", "Case-insensitive description search.");
        list.Options.Add(organizationOption);
        list.Options.Add(pageOption);
        list.Options.Add(pageSizeOption);
        list.Options.Add(fromOption);
        list.Options.Add(toOption);
        list.Options.Add(statusOption);
        list.Options.Add(descriptionOption);
        SetReadAction(
            list,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var (from, to) = ParseDateRange(result, fromOption, toOption);
                return await client.ListBillsAsync(
                    result.GetRequiredValue(organizationOption),
                    result.GetValue(pageOption),
                    result.GetValue(pageSizeOption),
                    from,
                    to,
                    result.GetValue(statusOption),
                    result.GetValue(descriptionOption),
                    cancellationToken);
            },
            response => ReadCommandTables.Bills(response.Data));

        var get = new Command("get", "Get one bill.");
        var getOrganizationOption = OrganizationOption();
        var billIdOption = RequiredGuidOption("--bill-id", "Bill ID.");
        get.Options.Add(getOrganizationOption);
        get.Options.Add(billIdOption);
        SetReadAction(
            get,
            services,
            outputOption,
            (result, client, cancellationToken) => client.GetBillAsync(
                result.GetRequiredValue(getOrganizationOption),
                result.GetRequiredValue(billIdOption),
                cancellationToken),
            ReadCommandTables.Bill);

        group.Subcommands.Add(list);
        group.Subcommands.Add(get);
        return group;
    }

    private static Command BuildExpensesCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var group = new Command("expenses", "Read BitFinance expenses.");
        var list = new Command("list", "List expenses for an organization.");
        var organizationOption = OrganizationOption();
        var pageOption = PositiveIntegerOption("--page", "Page number.", 1);
        var pageSizeOption = PositiveIntegerOption("--page-size", "Number of expenses per page.", 20);
        var fromOption = OptionalStringOption("--from", "Inclusive ISO 8601 start date and time.");
        var toOption = OptionalStringOption("--to", "Inclusive ISO 8601 end date and time.");
        var statusOption = OptionalStringOption("--status", "Expense status.");
        var descriptionOption = OptionalStringOption("--description", "Case-insensitive description search.");
        var paymentMethodOption = OptionalStringOption("--payment-method", "Payment method.");
        list.Options.Add(organizationOption);
        list.Options.Add(pageOption);
        list.Options.Add(pageSizeOption);
        list.Options.Add(fromOption);
        list.Options.Add(toOption);
        list.Options.Add(statusOption);
        list.Options.Add(descriptionOption);
        list.Options.Add(paymentMethodOption);
        SetReadAction(
            list,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var (from, to) = ParseDateRange(result, fromOption, toOption);
                return await client.ListExpensesAsync(
                    result.GetRequiredValue(organizationOption),
                    result.GetValue(pageOption),
                    result.GetValue(pageSizeOption),
                    from,
                    to,
                    result.GetValue(statusOption),
                    result.GetValue(descriptionOption),
                    result.GetValue(paymentMethodOption),
                    cancellationToken);
            },
            response => ReadCommandTables.Expenses(response.Data));

        var get = new Command("get", "Get one expense.");
        var getOrganizationOption = OrganizationOption();
        var expenseIdOption = RequiredGuidOption("--expense-id", "Expense ID.");
        get.Options.Add(getOrganizationOption);
        get.Options.Add(expenseIdOption);
        SetReadAction(
            get,
            services,
            outputOption,
            (result, client, cancellationToken) => client.GetExpenseAsync(
                result.GetRequiredValue(getOrganizationOption),
                result.GetRequiredValue(expenseIdOption),
                cancellationToken),
            ReadCommandTables.Expense);

        group.Subcommands.Add(list);
        group.Subcommands.Add(get);
        return group;
    }

    private static void SetReadAction<TResponse>(
        Command command,
        CliServices services,
        Option<OutputFormat> outputOption,
        Func<ParseResult, IBitFinanceApiClient, CancellationToken, Task<TResponse>> execute,
        Func<TResponse, TableData> table)
    {
        command.SetAction(async (parseResult, cancellationToken) =>
        {
            var configuration = CliConfiguration.Load(services.Environment);
            var client = services.ApiClientFactory.Create(configuration);
            var response = await execute(parseResult, client, cancellationToken);
            services.Output.WriteSuccess(response, parseResult.GetValue(outputOption), table(response));
            return 0;
        });
    }

    private static Option<Guid> OrganizationOption() =>
        RequiredGuidOption("--organization-id", "Organization ID.");

    private static Option<Guid> RequiredGuidOption(string name, string description) =>
        new(name)
        {
            Description = description,
            Required = true
        };

    private static Option<int> PositiveIntegerOption(
        string name,
        string description,
        int defaultValue)
    {
        var option = new Option<int>(name)
        {
            Description = description,
            DefaultValueFactory = _ => defaultValue
        };
        option.Validators.Add(result =>
        {
            if (result.GetValueOrDefault<int>() < 1)
            {
                result.AddError($"{name} must be greater than zero.");
            }
        });
        return option;
    }

    private static Option<string?> OptionalStringOption(string name, string description) =>
        new(name) { Description = description };

    private static (DateTimeOffset? From, DateTimeOffset? To) ParseDateRange(
        ParseResult result,
        Option<string?> fromOption,
        Option<string?> toOption)
    {
        var from = CliValueParsers.ParseOptionalDate(result.GetValue(fromOption), "--from");
        var to = CliValueParsers.ParseOptionalDate(result.GetValue(toOption), "--to");
        CliValueParsers.ValidateDateRange(from, to);
        return (from, to);
    }
}
