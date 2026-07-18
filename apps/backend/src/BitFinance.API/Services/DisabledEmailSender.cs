using BitFinance.API.Services.Interfaces;

namespace BitFinance.API.Services;

public sealed class DisabledEmailSender : IEmailSender
{
    public bool IsConfigured => false;

    public Task<EmailSendResult> SendBillReminderAsync(
        BillReminderEmail message,
        Guid idempotencyKey,
        CancellationToken cancellationToken) =>
        Task.FromResult(new EmailSendResult(false, Error: "Email delivery is disabled."));
}
