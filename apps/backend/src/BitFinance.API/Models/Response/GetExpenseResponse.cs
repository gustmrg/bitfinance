using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public class GetExpenseResponse
{
    public Guid Id { get; set; }
    public string Description { get; set; } = null!;
    public decimal Amount { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
    public string CreatedBy { get; set; } = null!;
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExpenseCategory Category { get; set; }
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExpenseStatus Status { get; set; }

    public ICollection<AttachmentResponseModel> Attachments { get; set; } = new List<AttachmentResponseModel>();
}