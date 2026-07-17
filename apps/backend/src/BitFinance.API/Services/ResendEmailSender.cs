using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using BitFinance.API.Services.Interfaces;
using BitFinance.API.Settings;
using Microsoft.Extensions.Options;

namespace BitFinance.API.Services;

public sealed class ResendEmailSender(HttpClient httpClient, IOptions<NotificationOptions> options) : IEmailSender
{
    private readonly NotificationOptions _options = options.Value;
    public bool IsConfigured => _options.EmailEnabled;

    public async Task<EmailSendResult> SendBillReminderAsync(
        BillReminderEmail message,
        Guid idempotencyKey,
        CancellationToken cancellationToken)
    {
        var rendered = PortugueseBillEmailRenderer.Render(message);
        using var request = new HttpRequestMessage(HttpMethod.Post, "emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ResendApiToken);
        request.Headers.Add("Idempotency-Key", idempotencyKey.ToString("N"));
        request.Content = JsonContent.Create(new
        {
            from = _options.FromAddress,
            to = new[] { message.RecipientEmail },
            subject = rendered.Subject,
            html = rendered.Html,
            text = rendered.Text,
        });

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            return new EmailSendResult(false, Error: $"Resend returned HTTP {(int)response.StatusCode}.");

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var document = await JsonDocument.ParseAsync(stream, cancellationToken: cancellationToken);
        var providerMessageId = document.RootElement.TryGetProperty("id", out var id) ? id.GetString() : null;

        return string.IsNullOrWhiteSpace(providerMessageId)
            ? new EmailSendResult(false, Error: "Resend response did not include a message ID.")
            : new EmailSendResult(true, providerMessageId);
    }
}
