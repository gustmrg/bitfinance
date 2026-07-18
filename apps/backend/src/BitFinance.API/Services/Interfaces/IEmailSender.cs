namespace BitFinance.API.Services.Interfaces;

public interface IEmailSender
{
    bool IsConfigured { get; }
    Task<EmailSendResult> SendBillReminderAsync(BillReminderEmail message, Guid idempotencyKey, CancellationToken cancellationToken);
}

public sealed record BillReminderEmail(
    string RecipientEmail,
    string RecipientName,
    string OrganizationName,
    string BillDescription,
    decimal AmountDue,
    DateOnly DueDate,
    string ReminderType,
    string ActionUrl);

public sealed record EmailSendResult(bool Success, string? ProviderMessageId = null, string? Error = null);
