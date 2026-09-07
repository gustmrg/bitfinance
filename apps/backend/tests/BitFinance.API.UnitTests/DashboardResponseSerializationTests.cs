using System.Text.Json;
using BitFinance.API.Models.Response;
using FluentAssertions;
using Xunit;

namespace BitFinance.API.UnitTests;

public class DashboardResponseSerializationTests
{
    [Fact]
    public void DashboardBillResponse_DueDate_SerializesAsDateOnly()
    {
        var response = new DashboardBillResponse
        {
            DueDate = new DateOnly(2026, 8, 5)
        };

        var json = JsonSerializer.Serialize(response, JsonSerializerOptions.Web);

        using var document = JsonDocument.Parse(json);
        document.RootElement.GetProperty("dueDate").GetString().Should().Be("2026-08-05");
    }
}
