using BitFinance.API.Services;
using BitFinance.API.Services.Interfaces;
using Xunit;

namespace BitFinance.API.UnitTests;

public class PortugueseBillEmailRendererTests
{
    [Fact]
    public void Render_FormatsPortugueseCopyAndEscapesUserContent()
    {
        var message = new BillReminderEmail(
            "member@example.com",
            "Ana",
            "Casa & Família",
            "Luz <julho>",
            123.45m,
            new DateOnly(2026, 7, 18),
            "BillDueSoon",
            "https://example.com/dashboard/bills/123");

        var result = PortugueseBillEmailRenderer.Render(message);

        Assert.Contains("vence em 3 dias", result.Subject, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("R$", result.Html);
        Assert.Contains("123,45", result.Html);
        Assert.Contains("Casa &amp;", result.Html);
        Assert.DoesNotContain("Casa & Família", result.Html);
        Assert.Contains("Luz &lt;julho&gt;", result.Html);
        Assert.DoesNotContain("Luz <julho>", result.Html);
        Assert.Contains("https://example.com/dashboard/bills/123", result.Html);
        Assert.Contains("Luz <julho>", result.Text);
    }
}
