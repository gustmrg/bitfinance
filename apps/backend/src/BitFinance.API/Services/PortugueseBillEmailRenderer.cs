using System.Globalization;
using System.Net;
using BitFinance.API.Services.Interfaces;

namespace BitFinance.API.Services;

public static class PortugueseBillEmailRenderer
{
    private static readonly CultureInfo Culture = CultureInfo.GetCultureInfo("pt-BR");

    public static RenderedEmail Render(BillReminderEmail message)
    {
        var reminder = message.ReminderType switch
        {
            "BillDueSoon" => "vence em 3 dias",
            "BillDueToday" => "vence hoje",
            "BillOverdue" => "está vencida",
            _ => "precisa da sua atenção",
        };
        var subject = $"{message.BillDescription} {reminder}";
        var amount = message.AmountDue.ToString("C", Culture);
        var dueDate = message.DueDate.ToString("dd 'de' MMMM 'de' yyyy", Culture);

        var safeName = WebUtility.HtmlEncode(message.RecipientName);
        var safeOrganization = WebUtility.HtmlEncode(message.OrganizationName);
        var safeDescription = WebUtility.HtmlEncode(message.BillDescription);
        var safeActionUrl = WebUtility.HtmlEncode(message.ActionUrl);

        var html = $$"""
            <!doctype html>
            <html lang="pt-BR">
            <body style="margin:0;background:#f4f6fb;color:#172033;font-family:Arial,sans-serif">
              <div style="max-width:600px;margin:0 auto;padding:32px 20px">
                <div style="background:#fff;border:1px solid #dfe5f1;border-radius:18px;padding:30px">
                  <p style="margin:0 0 8px;color:#2f5bea;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">BitFinance · {{safeOrganization}}</p>
                  <h1 style="margin:0 0 18px;font-size:26px;line-height:1.2">{{safeDescription}} {{reminder}}</h1>
                  <p style="margin:0 0 22px;color:#59647a">Olá, {{safeName}}. Esta conta está no seu horizonte financeiro.</p>
                  <div style="border-left:4px solid #2f5bea;padding:4px 0 4px 16px;margin-bottom:24px">
                    <strong style="display:block;font-size:22px">{{amount}}</strong>
                    <span style="color:#59647a">Vencimento: {{dueDate}}</span>
                  </div>
                  <a href="{{safeActionUrl}}" style="display:inline-block;background:#2f5bea;color:#fff;text-decoration:none;border-radius:10px;padding:12px 18px;font-weight:700">Ver conta</a>
                </div>
              </div>
            </body>
            </html>
            """;
        var text = $"Olá, {message.RecipientName}. {message.BillDescription} {reminder}. Valor: {amount}. Vencimento: {dueDate}. Ver conta: {message.ActionUrl}";

        return new RenderedEmail(subject, html, text);
    }
}

public sealed record RenderedEmail(string Subject, string Html, string Text);
