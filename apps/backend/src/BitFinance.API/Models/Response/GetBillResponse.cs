using System.Text.Json.Serialization;
using BitFinance.Business.Enums;

namespace BitFinance.API.Models.Response;

public class GetBillResponse
{
    public Guid Id { get; set; }
    
    public string Description { get; set; } = null!;
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BillCategory Category { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BillStatus Status { get; set; }
    
    public decimal AmountDue { get; set; }
    
    public decimal? AmountPaid { get; set; }
    
    public DateTimeOffset CreatedAt { get; set; }
    
    public DateTime DueDate { get; set; }
    
    public DateTimeOffset? PaymentDate { get; set; }
    public ICollection<AttachmentResponseModel> Attachments { get; set; } = new List<AttachmentResponseModel>();
}