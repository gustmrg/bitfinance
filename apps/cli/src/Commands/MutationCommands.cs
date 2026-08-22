using BitFinance.Cli.Configuration;
using BitFinance.Cli.Errors;
using BitFinance.Cli.Models;
using BitFinance.Cli.Output;
using BitFinance.Cli.Services;
using System.CommandLine;

namespace BitFinance.Cli.Commands;

public static class MutationCommands
{
    private static readonly string[] BillCategories =
        ["Housing", "Transportation", "Food", "Utilities", "Clothing", "Healthcare", "Insurance", "Personal", "Debt", "Savings", "Education", "Entertainment", "Miscellaneous", "Subscriptions", "Taxes", "Pets"];
    private static readonly string[] BillStatuses = ["Created", "Due", "Paid", "Overdue", "Cancelled", "Upcoming"];
    private static readonly string[] ExpenseCategories =
        ["Housing", "Transportation", "Food", "Utilities", "Clothing", "Healthcare", "Insurance", "Personal", "Debt", "Savings", "Education", "Entertainment", "Travel", "Pets", "Gifts", "Miscellaneous", "Subscriptions", "Taxes"];
    private static readonly string[] ExpenseStatuses = ["Pending", "Paid", "Cancelled"];
    private static readonly string[] PaymentMethods = ["Cash", "CreditCard", "DebitCard", "Pix", "BankTransfer", "Boleto", "Other"];
    private static readonly string[] FileCategories = ["Boleto", "Receipt", "Invoice", "Other"];

    public static void AddTo(
        RootCommand rootCommand,
        CliServices services,
        Option<OutputFormat> outputOption)
    {
        var bills = FindGroup(rootCommand, "bills");
        bills.Subcommands.Add(BuildCreateBillCommand(services, outputOption));
        bills.Subcommands.Add(BuildUpdateBillCommand(services, outputOption));
        bills.Subcommands.Add(BuildDeleteBillCommand(services, outputOption));
        bills.Subcommands.Add(BuildStopBillSeriesCommand(services, outputOption));
        bills.Subcommands.Add(BuildBillDocumentsCommand(services, outputOption));

        var expenses = FindGroup(rootCommand, "expenses");
        expenses.Subcommands.Add(BuildCreateExpenseCommand(services, outputOption));
        expenses.Subcommands.Add(BuildUpdateExpenseCommand(services, outputOption));
        expenses.Subcommands.Add(BuildExpenseDocumentsCommand(services, outputOption));
    }

    private static Command BuildCreateBillCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var command = new Command("create", "Create a one-time, recurring, or installment bill.");
        var organization = OrganizationOption();
        var description = RequiredTextOption("--description", "Bill description.");
        var category = RequiredChoiceOption("--category", "Bill category.", BillCategories);
        var status = RequiredChoiceOption("--status", "Bill status.", BillStatuses);
        var dueDate = RequiredTextOption("--due-date", "Due date and time in ISO 8601 format.");
        var amountDue = RequiredTextOption("--amount-due", "Amount due using invariant decimal formatting.");
        var paymentDate = OptionalTextOption("--payment-date", "Payment date and time in ISO 8601 format.");
        var amountPaid = OptionalTextOption("--amount-paid", "Amount paid using invariant decimal formatting.");
        var frequency = new Option<BillFrequency?>("--frequency") { Description = "Recurrence frequency." };
        var installments = new Option<int?>("--installments") { Description = "Positive installment count." };
        installments.Validators.Add(result =>
        {
            if (result.GetValueOrDefault<int?>() is <= 0)
            {
                result.AddError("--installments must be greater than zero.");
            }
        });
        var notes = OptionalTextOption("--notes", "Optional notes; pass an empty value to clear where supported.");
        AddOptions(command, organization, description, category, status, dueDate, amountDue, paymentDate, amountPaid, frequency, installments, notes);

        SetApiAction(
            command,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var resolvedFrequency = result.GetValue(frequency);
                var resolvedInstallments = result.GetValue(installments);
                if (resolvedInstallments.HasValue && !resolvedFrequency.HasValue)
                {
                    throw CliException.InvalidArguments("--installments requires --frequency.");
                }

                if (resolvedFrequency.HasValue
                    && (result.GetValue(paymentDate) is not null || result.GetValue(amountPaid) is not null))
                {
                    throw CliException.InvalidArguments(
                        "--payment-date and --amount-paid apply only to one-time bills.");
                }

                var resolvedNotes = result.GetValue(notes);
                CliValueParsers.ValidateNotes(resolvedNotes);
                var request = new CreateBillRequest(
                    result.GetRequiredValue(description),
                    result.GetRequiredValue(category),
                    result.GetRequiredValue(status),
                    CliValueParsers.ParseRequiredDate(result.GetRequiredValue(dueDate), "--due-date"),
                    CliValueParsers.ParseOptionalDate(result.GetValue(paymentDate), "--payment-date"),
                    CliValueParsers.ParseRequiredDecimal(result.GetRequiredValue(amountDue), "--amount-due"),
                    CliValueParsers.ParseOptionalDecimal(result.GetValue(amountPaid), "--amount-paid"),
                    resolvedFrequency,
                    resolvedInstallments,
                    resolvedNotes);
                return await client.CreateBillAsync(
                    result.GetRequiredValue(organization),
                    request,
                    cancellationToken);
            },
            ReadCommandTables.Bill);
        return command;
    }

    private static Command BuildUpdateBillCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var command = new Command("update", "Update one bill occurrence.");
        var organization = OrganizationOption();
        var billId = RequiredGuidOption("--bill-id", "Bill ID.");
        var description = RequiredTextOption("--description", "Bill description.");
        var category = RequiredChoiceOption("--category", "Bill category.", BillCategories);
        var status = RequiredChoiceOption("--status", "Bill status.", BillStatuses);
        var dueDate = RequiredTextOption("--due-date", "Due date and time in ISO 8601 format.");
        var amountDue = RequiredTextOption("--amount-due", "Amount due using invariant decimal formatting.");
        var paymentDate = OptionalTextOption("--payment-date", "Payment date and time in ISO 8601 format.");
        var amountPaid = OptionalTextOption("--amount-paid", "Amount paid using invariant decimal formatting.");
        var notes = OptionalTextOption("--notes", "Omit to preserve notes; pass an empty value to clear them.");
        AddOptions(command, organization, billId, description, category, status, dueDate, amountDue, paymentDate, amountPaid, notes);

        SetApiAction(
            command,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var resolvedNotes = result.GetValue(notes);
                CliValueParsers.ValidateNotes(resolvedNotes);
                var request = new UpdateBillRequest(
                    result.GetRequiredValue(description),
                    result.GetRequiredValue(category),
                    result.GetRequiredValue(status),
                    CliValueParsers.ParseRequiredDate(result.GetRequiredValue(dueDate), "--due-date"),
                    CliValueParsers.ParseOptionalDate(result.GetValue(paymentDate), "--payment-date"),
                    CliValueParsers.ParseRequiredDecimal(result.GetRequiredValue(amountDue), "--amount-due"),
                    CliValueParsers.ParseOptionalDecimal(result.GetValue(amountPaid), "--amount-paid"),
                    resolvedNotes);
                return await client.UpdateBillAsync(
                    result.GetRequiredValue(organization),
                    result.GetRequiredValue(billId),
                    request,
                    cancellationToken);
            },
            MutationCommandTables.UpdatedBill);
        return command;
    }

    private static Command BuildDeleteBillCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var command = new Command("delete", "Delete one bill occurrence and its documents.");
        var organization = OrganizationOption();
        var billId = RequiredGuidOption("--bill-id", "Bill ID.");
        var confirm = ConfirmationOption();
        AddOptions(command, organization, billId, confirm);
        RequireConfirmationAtParse(command, confirm);
        SetApiAction(
            command,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                RequireConfirmation(result, confirm);
                var resolvedBillId = result.GetRequiredValue(billId);
                await client.DeleteBillAsync(
                    result.GetRequiredValue(organization),
                    resolvedBillId,
                    cancellationToken);
                return new DeleteBillResponse(true, resolvedBillId);
            });
        return command;
    }

    private static Command BuildStopBillSeriesCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var command = new Command("stop-series", "Stop future generation for a bill series.");
        var organization = OrganizationOption();
        var seriesId = RequiredGuidOption("--series-id", "Bill series ID.");
        var confirm = ConfirmationOption();
        AddOptions(command, organization, seriesId, confirm);
        RequireConfirmationAtParse(command, confirm);
        SetApiAction(
            command,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                RequireConfirmation(result, confirm);
                var resolvedSeriesId = result.GetRequiredValue(seriesId);
                await client.StopBillSeriesAsync(
                    result.GetRequiredValue(organization),
                    resolvedSeriesId,
                    cancellationToken);
                return new StopBillSeriesResponse(true, resolvedSeriesId);
            });
        return command;
    }

    private static Command BuildCreateExpenseCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var command = new Command("create", "Create an expense.");
        var organization = OrganizationOption();
        var description = RequiredTextOption("--description", "Expense description.");
        var category = RequiredChoiceOption("--category", "Expense category.", ExpenseCategories);
        var amount = RequiredTextOption("--amount", "Amount using invariant decimal formatting.");
        var status = RequiredChoiceOption("--status", "Expense status.", ExpenseStatuses);
        var occurredAt = OptionalTextOption("--occurred-at", "Occurrence date and time in ISO 8601 format.");
        var createdBy = OptionalTextOption("--created-by", "BitFinance user ID; defaults to the token owner.");
        var notes = OptionalTextOption("--notes", "Optional notes.");
        var paymentMethod = OptionalChoiceOption("--payment-method", "Payment method.", PaymentMethods);
        AddOptions(command, organization, description, category, amount, status, occurredAt, createdBy, notes, paymentMethod);

        SetApiAction(
            command,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var resolvedNotes = result.GetValue(notes);
                CliValueParsers.ValidateNotes(resolvedNotes);
                var resolvedCreatedBy = result.GetValue(createdBy);
                if (string.IsNullOrWhiteSpace(resolvedCreatedBy))
                {
                    resolvedCreatedBy = (await client.GetCurrentUserAsync(cancellationToken)).Id;
                }

                var request = new CreateExpenseRequest(
                    result.GetRequiredValue(description),
                    result.GetRequiredValue(category),
                    CliValueParsers.ParseRequiredDecimal(result.GetRequiredValue(amount), "--amount"),
                    result.GetRequiredValue(status),
                    CliValueParsers.ParseOptionalDate(result.GetValue(occurredAt), "--occurred-at"),
                    resolvedCreatedBy,
                    resolvedNotes,
                    result.GetValue(paymentMethod));
                return await client.CreateExpenseAsync(
                    result.GetRequiredValue(organization),
                    request,
                    cancellationToken);
            },
            ReadCommandTables.Expense);
        return command;
    }

    private static Command BuildUpdateExpenseCommand(CliServices services, Option<OutputFormat> outputOption)
    {
        var command = new Command("update", "Update an expense.");
        var organization = OrganizationOption();
        var expenseId = RequiredGuidOption("--expense-id", "Expense ID.");
        var description = RequiredTextOption("--description", "Expense description.");
        var category = RequiredChoiceOption("--category", "Expense category.", ExpenseCategories);
        var amount = RequiredTextOption("--amount", "Amount using invariant decimal formatting.");
        var status = RequiredChoiceOption("--status", "Expense status.", ExpenseStatuses);
        var occurredAt = RequiredTextOption("--occurred-at", "Occurrence date and time in ISO 8601 format.");
        var notes = OptionalTextOption("--notes", "Omit to preserve notes; pass an empty value to clear them.");
        var paymentMethod = OptionalChoiceOption(
            "--payment-method",
            "Omit to preserve payment method; pass an empty value to clear it.",
            PaymentMethods,
            allowEmpty: true);
        AddOptions(command, organization, expenseId, description, category, amount, status, occurredAt, notes, paymentMethod);

        SetApiAction(
            command,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var resolvedNotes = result.GetValue(notes);
                CliValueParsers.ValidateNotes(resolvedNotes);
                var request = new UpdateExpenseRequest(
                    result.GetRequiredValue(description),
                    result.GetRequiredValue(category),
                    CliValueParsers.ParseRequiredDecimal(result.GetRequiredValue(amount), "--amount"),
                    result.GetRequiredValue(status),
                    CliValueParsers.ParseRequiredDate(result.GetRequiredValue(occurredAt), "--occurred-at"),
                    resolvedNotes,
                    result.GetValue(paymentMethod));
                return await client.UpdateExpenseAsync(
                    result.GetRequiredValue(organization),
                    result.GetRequiredValue(expenseId),
                    request,
                    cancellationToken);
            },
            ReadCommandTables.Expense);
        return command;
    }

    private static Command BuildBillDocumentsCommand(CliServices services, Option<OutputFormat> outputOption) =>
        BuildDocumentsCommand(
            services,
            outputOption,
            "bill",
            "--bill-id",
            (client, organizationId, ownerId, stream, fileName, contentType, category, cancellationToken) =>
                client.UploadBillDocumentAsync(organizationId, ownerId, stream, fileName, contentType, category, cancellationToken),
            (client, organizationId, ownerId, documentId, cancellationToken) =>
                client.GetBillDocumentDownloadUrlAsync(organizationId, ownerId, documentId, cancellationToken),
            (client, organizationId, ownerId, documentId, cancellationToken) =>
                client.DeleteBillDocumentAsync(organizationId, ownerId, documentId, cancellationToken));

    private static Command BuildExpenseDocumentsCommand(CliServices services, Option<OutputFormat> outputOption) =>
        BuildDocumentsCommand(
            services,
            outputOption,
            "expense",
            "--expense-id",
            (client, organizationId, ownerId, stream, fileName, contentType, category, cancellationToken) =>
                client.UploadExpenseDocumentAsync(organizationId, ownerId, stream, fileName, contentType, category, cancellationToken),
            (client, organizationId, ownerId, documentId, cancellationToken) =>
                client.GetExpenseDocumentDownloadUrlAsync(organizationId, ownerId, documentId, cancellationToken),
            (client, organizationId, ownerId, documentId, cancellationToken) =>
                client.DeleteExpenseDocumentAsync(organizationId, ownerId, documentId, cancellationToken));

    private static Command BuildDocumentsCommand(
        CliServices services,
        Option<OutputFormat> outputOption,
        string ownerName,
        string ownerOptionName,
        Func<IBitFinanceApiClient, Guid, Guid, Stream, string, string, string, CancellationToken, Task<UploadDocumentResponse>> uploadDocument,
        Func<IBitFinanceApiClient, Guid, Guid, Guid, CancellationToken, Task<DocumentDownloadUrlResponse>> getDownloadUrl,
        Func<IBitFinanceApiClient, Guid, Guid, Guid, CancellationToken, Task> deleteDocument)
    {
        var article = ownerName.StartsWith('e') ? "an" : "a";
        var group = new Command("documents", $"Manage documents attached to {article} {ownerName}.");

        var upload = new Command("upload", $"Upload a document to {article} {ownerName}.");
        var uploadOrganization = OrganizationOption();
        var uploadOwner = RequiredGuidOption(ownerOptionName, $"{Capitalize(ownerName)} ID.");
        var file = new Option<FileInfo>("--file") { Description = "Local document path.", Required = true };
        var fileCategory = RequiredChoiceOption("--file-category", "Document category.", FileCategories);
        var contentType = OptionalTextOption("--content-type", "Optional MIME type; inferred from the extension by default.");
        AddOptions(upload, uploadOrganization, uploadOwner, file, fileCategory, contentType);
        SetApiAction(
            upload,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                var document = DocumentUpload.Validate(result.GetRequiredValue(file), result.GetValue(contentType));
                await using var stream = document.File.Open(FileMode.Open, FileAccess.Read, FileShare.Read);
                return await uploadDocument(
                    client,
                    result.GetRequiredValue(uploadOrganization),
                    result.GetRequiredValue(uploadOwner),
                    stream,
                    document.File.Name,
                    document.ContentType,
                    result.GetRequiredValue(fileCategory),
                    cancellationToken);
            },
            MutationCommandTables.UploadedDocument);

        var downloadUrl = new Command("download-url", $"Get a temporary download URL for {article} {ownerName} document.");
        var downloadOrganization = OrganizationOption();
        var downloadOwner = RequiredGuidOption(ownerOptionName, $"{Capitalize(ownerName)} ID.");
        var downloadDocumentId = RequiredGuidOption("--document-id", "Document ID.");
        AddOptions(downloadUrl, downloadOrganization, downloadOwner, downloadDocumentId);
        SetApiAction(
            downloadUrl,
            services,
            outputOption,
            (result, client, cancellationToken) => getDownloadUrl(
                client,
                result.GetRequiredValue(downloadOrganization),
                result.GetRequiredValue(downloadOwner),
                result.GetRequiredValue(downloadDocumentId),
                cancellationToken),
            MutationCommandTables.DownloadUrl);

        var delete = new Command("delete", $"Delete a document attached to {article} {ownerName}.");
        var deleteOrganization = OrganizationOption();
        var deleteOwner = RequiredGuidOption(ownerOptionName, $"{Capitalize(ownerName)} ID.");
        var deleteDocumentId = RequiredGuidOption("--document-id", "Document ID.");
        var confirm = ConfirmationOption();
        AddOptions(delete, deleteOrganization, deleteOwner, deleteDocumentId, confirm);
        RequireConfirmationAtParse(delete, confirm);
        SetApiAction(
            delete,
            services,
            outputOption,
            async (result, client, cancellationToken) =>
            {
                RequireConfirmation(result, confirm);
                var resolvedDocumentId = result.GetRequiredValue(deleteDocumentId);
                await deleteDocument(
                    client,
                    result.GetRequiredValue(deleteOrganization),
                    result.GetRequiredValue(deleteOwner),
                    resolvedDocumentId,
                    cancellationToken);
                return new DeleteDocumentResponse(true, resolvedDocumentId);
            });

        group.Subcommands.Add(upload);
        group.Subcommands.Add(downloadUrl);
        group.Subcommands.Add(delete);
        return group;
    }

    private static void SetApiAction<TResponse>(
        Command command,
        CliServices services,
        Option<OutputFormat> outputOption,
        Func<ParseResult, IBitFinanceApiClient, CancellationToken, Task<TResponse>> execute,
        Func<TResponse, TableData>? table = null)
    {
        command.SetAction(async (parseResult, cancellationToken) =>
        {
            var configuration = CliConfiguration.Load(services.Environment);
            var client = services.ApiClientFactory.Create(configuration);
            var response = await execute(parseResult, client, cancellationToken);
            services.Output.WriteSuccess(
                response,
                parseResult.GetValue(outputOption),
                table?.Invoke(response));
            return ExitCodes.Success;
        });
    }

    private static Command FindGroup(RootCommand rootCommand, string name) =>
        rootCommand.Subcommands.Single(command => command.Name == name);

    private static Option<Guid> OrganizationOption() =>
        RequiredGuidOption("--organization-id", "Organization ID.");

    private static Option<Guid> RequiredGuidOption(string name, string description) =>
        new(name) { Description = description, Required = true };

    private static Option<string> RequiredTextOption(string name, string description)
    {
        var option = new Option<string>(name) { Description = description, Required = true };
        option.Validators.Add(result =>
        {
            if (string.IsNullOrWhiteSpace(result.GetValueOrDefault<string>()))
            {
                result.AddError($"{name} cannot be empty.");
            }
        });
        return option;
    }

    private static Option<string> RequiredChoiceOption(
        string name,
        string description,
        IReadOnlyCollection<string> allowedValues)
    {
        var option = RequiredTextOption(name, description);
        AddChoiceValidator(option, name, allowedValues, allowEmpty: false);
        return option;
    }

    private static Option<string?> OptionalChoiceOption(
        string name,
        string description,
        IReadOnlyCollection<string> allowedValues,
        bool allowEmpty = false)
    {
        var option = OptionalTextOption(name, description);
        AddChoiceValidator(option, name, allowedValues, allowEmpty);
        return option;
    }

    private static void AddChoiceValidator<T>(
        Option<T> option,
        string name,
        IReadOnlyCollection<string> allowedValues,
        bool allowEmpty)
    {
        option.Validators.Add(result =>
        {
            var value = result.GetValueOrDefault<T>()?.ToString();
            if (value is null || (allowEmpty && value.Length == 0))
            {
                return;
            }

            if (!allowedValues.Contains(value, StringComparer.OrdinalIgnoreCase))
            {
                result.AddError($"{name} must be one of: {string.Join(", ", allowedValues)}.");
            }
        });
    }

    private static Option<string?> OptionalTextOption(string name, string description) =>
        new(name) { Description = description };

    private static Option<bool> ConfirmationOption() =>
        new("--confirm")
        {
            Description = "Confirm this destructive operation.",
            Required = true
        };

    private static void RequireConfirmation(ParseResult result, Option<bool> confirmation)
    {
        if (!result.GetValue(confirmation))
        {
            throw CliException.InvalidArguments("--confirm is required for this destructive operation.");
        }
    }

    private static void RequireConfirmationAtParse(Command command, Option<bool> confirmation)
    {
        command.Validators.Add(result =>
        {
            if (result.GetResult(confirmation) is not { Implicit: false })
            {
                result.AddError("--confirm is required for this destructive operation.");
            }
        });
    }

    private static void AddOptions(Command command, params Option[] options)
    {
        foreach (var option in options)
        {
            command.Options.Add(option);
        }
    }

    private static string Capitalize(string value) =>
        char.ToUpperInvariant(value[0]) + value[1..];
}
