using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories;

namespace BitFinance.API.Models;

/// <summary>
/// Validated input for creating a bill, with enums already parsed. A frequency makes it a series.
/// </summary>
public record CreateBillData(
    string Description,
    BillCategory Category,
    BillStatus Status,
    DateTime DueDate,
    DateTime? PaymentDate,
    decimal AmountDue,
    decimal? AmountPaid,
    Frequency? Frequency,
    int? Installments,
    string? Notes);

/// <summary>
/// Validated input for updating a bill. Null notes keep the current notes.
/// </summary>
public record UpdateBillData(
    string Description,
    BillCategory Category,
    BillStatus Status,
    DateTime DueDate,
    DateTime? PaymentDate,
    decimal AmountDue,
    decimal? AmountPaid,
    string? Notes);

public record BillListQuery(
    int Page,
    int PageSize,
    DateTime? From,
    DateTime? To,
    List<BillStatus>? Statuses,
    string? Description,
    BillTypeFilter? Type);

public record BillPage(List<Bill> Items, int TotalCount, BillListSummary Summary);
