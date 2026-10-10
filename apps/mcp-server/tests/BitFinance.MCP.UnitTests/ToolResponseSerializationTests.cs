using System.Text.Json;
using BitFinance.MCP.Models;
using ModelContextProtocol;
using Xunit;

namespace BitFinance.MCP.UnitTests;

public class ToolResponseSerializationTests
{
    [Fact]
    public void BillResponse_NullNotes_IsStillSerialized()
    {
        var json = JsonSerializer.Serialize(new BillResponse(), McpJsonUtilities.DefaultOptions);

        using var document = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("notes").ValueKind);
    }

    [Fact]
    public void ExpenseResponse_NullNotesAndPaymentMethod_AreStillSerialized()
    {
        var json = JsonSerializer.Serialize(new ExpenseResponse(), McpJsonUtilities.DefaultOptions);

        using var document = JsonDocument.Parse(json);
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("notes").ValueKind);
        Assert.Equal(JsonValueKind.Null, document.RootElement.GetProperty("paymentMethod").ValueKind);
    }

    [Theory]
    [InlineData("2026-08-05T00:00:00")]
    [InlineData("2026-08-05T00:00:00Z")]
    [InlineData("2026-08-05")]
    public void BillResponse_DueDate_KeepsCalendarDateAsSentByApi(string dueDate)
    {
        var json = $$"""{"id":"{{Guid.NewGuid()}}","description":"Rent","dueDate":"{{dueDate}}"}""";

        var bill = JsonSerializer.Deserialize(json, BitFinanceJsonContext.Default.BillResponse)!;

        Assert.Equal(new DateOnly(2026, 8, 5), bill.DueDate);
        using var document = JsonDocument.Parse(JsonSerializer.Serialize(bill, McpJsonUtilities.DefaultOptions));
        Assert.Equal("2026-08-05", document.RootElement.GetProperty("dueDate").GetString());
    }

    [Fact]
    public void DashboardBillResponse_DateOnlyDueDate_IsRead()
    {
        var json = $$"""{"data":[{"id":"{{Guid.NewGuid()}}","description":"Rent","createdAt":"2026-07-01T12:00:00Z","dueDate":"2026-08-05"}]}""";

        var response = JsonSerializer.Deserialize(json, BitFinanceJsonContext.Default.UpcomingBillsResponse)!;

        Assert.Equal(new DateOnly(2026, 8, 5), response.Data[0].DueDate);
    }

    [Fact]
    public void Timestamps_WithoutOffset_AreReadAsUtc()
    {
        var json = $$"""{"id":"{{Guid.NewGuid()}}","name":"Home","createdAt":"2026-07-01T12:00:00","planTier":"Free","planExpiresAt":"2026-12-31T00:00:00"}""";

        var organization = JsonSerializer.Deserialize(json, BitFinanceJsonContext.Default.OrganizationDetailsResponse)!;

        Assert.Equal(TimeSpan.Zero, organization.CreatedAt.Offset);
        Assert.Equal(new DateTimeOffset(2026, 7, 1, 12, 0, 0, TimeSpan.Zero), organization.CreatedAt);
    }

    [Fact]
    public void CreateBillRequest_DueDate_IsSentAsCalendarDate()
    {
        var request = new CreateBillRequest("Rent", "Housing", "Due", new DateOnly(2026, 8, 5), null, 100m, null);

        using var document = JsonDocument.Parse(JsonSerializer.Serialize(request, BitFinanceJsonContext.Default.CreateBillRequest));

        Assert.Equal("2026-08-05", document.RootElement.GetProperty("dueDate").GetString());
    }
}
