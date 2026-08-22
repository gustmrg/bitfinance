using System.Text.Json.Serialization;

namespace BitFinance.Cli.Models;

public sealed record OrganizationSummaryResponse(Guid Id, string Name, string PlanTier);

public sealed class OrganizationDetailsResponse
{
    public Guid Id { get; init; }
    public string Name { get; init; } = string.Empty;
    public DateTimeOffset CreatedAt { get; init; }
    public DateTimeOffset? UpdatedAt { get; init; }
    public string PlanTier { get; init; } = string.Empty;
    public DateTimeOffset PlanExpiresAt { get; init; }
    public List<OrganizationMemberResponse> Members { get; init; } = [];
}

public sealed record OrganizationMemberResponse(string Id, string UserName, string Email);

public class PagedResponse<T>
{
    public List<T> Data { get; init; } = [];
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalRecords { get; init; }
    public int TotalPages { get; init; }
}

public sealed class AttachmentResponse
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public string FileCategory { get; init; } = string.Empty;
    public string AttachmentType { get; init; } = string.Empty;
}

public sealed class BillResponse
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public decimal AmountDue { get; init; }
    public decimal? AmountPaid { get; init; }
    public DateTimeOffset? CreatedAt { get; init; }
    public DateTimeOffset? CreatedDate { get; init; }
    public DateTimeOffset? DueDate { get; init; }
    public DateTimeOffset? PaymentDate { get; init; }
    public DateTimeOffset? PaidDate { get; init; }
    public Guid? BillSeriesId { get; init; }
    public int? OccurrenceNumber { get; init; }
    public int? TotalOccurrences { get; init; }
    public string? BillSeriesType { get; init; }
    public bool? BillSeriesIsActive { get; init; }
    public List<AttachmentResponse> Attachments { get; init; } = [];
}

public sealed class ExpenseResponse
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public string? PaymentMethod { get; init; }
    public decimal Amount { get; init; }
    public DateTimeOffset OccurredAt { get; init; }
    public string CreatedBy { get; init; } = string.Empty;
    public List<AttachmentResponse> Attachments { get; init; } = [];
}

public sealed class ExpensePageResponse : PagedResponse<ExpenseResponse>
{
    public ExpenseSummaryResponse Summary { get; init; } = new();
}

public sealed class ExpenseSummaryResponse
{
    public decimal TotalAmount { get; init; }
    public decimal AverageAmount { get; init; }
}

public sealed class UpcomingBillsResponse
{
    public List<DashboardBillResponse> Data { get; init; } = [];
}

public sealed class RecentExpensesResponse
{
    public List<DashboardExpenseResponse> Data { get; init; } = [];
}

public sealed class DashboardBillResponse
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public decimal AmountDue { get; init; }
    public DateTimeOffset DueDate { get; init; }
}

public sealed class DashboardExpenseResponse
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string Category { get; init; } = string.Empty;
    public decimal Amount { get; init; }
    public DateTimeOffset Date { get; init; }
}

[JsonConverter(typeof(JsonStringEnumConverter<BillFrequency>))]
public enum BillFrequency
{
    Daily,
    Weekly,
    Monthly,
    Annually
}

public sealed record CreateBillRequest(
    string Description,
    string Category,
    string Status,
    DateTimeOffset DueDate,
    DateTimeOffset? PaymentDate,
    decimal AmountDue,
    decimal? AmountPaid,
    BillFrequency? Frequency = null,
    int? Installments = null,
    string? Notes = null);

public sealed record UpdateBillRequest(
    string Description,
    string Category,
    string Status,
    DateTimeOffset DueDate,
    DateTimeOffset? PaymentDate,
    decimal AmountDue,
    decimal? AmountPaid,
    string? Notes = null);

public sealed class UpdateBillResponse
{
    public Guid Id { get; init; }
    public string Description { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public string Category { get; init; } = string.Empty;
    public string Status { get; init; } = string.Empty;
    public decimal AmountDue { get; init; }
    public decimal? AmountPaid { get; init; }
    public DateTimeOffset DueDate { get; init; }
    public DateTimeOffset? PaidDate { get; init; }
    public Guid? BillSeriesId { get; init; }
    public int? OccurrenceNumber { get; init; }
    public int? TotalOccurrences { get; init; }
    public string? BillSeriesType { get; init; }
    public bool? BillSeriesIsActive { get; init; }
}

public sealed record CreateExpenseRequest(
    string Description,
    string Category,
    decimal Amount,
    string Status,
    DateTimeOffset? OccurredAt,
    string CreatedBy,
    string? Notes = null,
    string? PaymentMethod = null);

public sealed record UpdateExpenseRequest(
    string Description,
    string Category,
    decimal Amount,
    string Status,
    DateTimeOffset OccurredAt,
    string? Notes = null,
    string? PaymentMethod = null);

public sealed class UploadDocumentResponse
{
    public Guid Id { get; init; }
    public string FileName { get; init; } = string.Empty;
    public string ContentType { get; init; } = string.Empty;
    public string FileCategory { get; init; } = string.Empty;
    public string AttachmentType { get; init; } = string.Empty;
}

public sealed record DocumentDownloadUrlResponse(
    string Url,
    string FileName,
    string ContentType,
    DateTimeOffset ExpiresAt);

public sealed record CurrentUserResponse(string Id);

public sealed record DeleteBillResponse(bool Deleted, Guid BillId);

public sealed record StopBillSeriesResponse(bool Stopped, Guid SeriesId);

public sealed record DeleteDocumentResponse(bool Deleted, Guid DocumentId);
