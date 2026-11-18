using BitFinance.API.Models;
using BitFinance.API.Observability;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Results;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class BillsService : IBillsService
{
    private readonly IBillsRepository _billsRepository;
    private readonly IBillSeriesRepository _billSeriesRepository;
    private readonly IBillGenerationService _billGenerationService;
    private readonly IAttachmentService _attachmentService;
    private readonly IOrganizationsRepository _organizationsRepository;

    public BillsService(
        IBillsRepository billsRepository,
        IBillSeriesRepository billSeriesRepository,
        IBillGenerationService billGenerationService,
        IAttachmentService attachmentService,
        IOrganizationsRepository organizationsRepository)
    {
        _billsRepository = billsRepository;
        _billSeriesRepository = billSeriesRepository;
        _billGenerationService = billGenerationService;
        _attachmentService = attachmentService;
        _organizationsRepository = organizationsRepository;
    }

    public async Task<List<Bill>> GetUpcomingBills(Guid organizationId, DateOnly? from = null, DateOnly? to = null)
    {
        return await _billsRepository.GetUpcomingBills(organizationId, from, to);
    }

    public async Task<(decimal TotalAmount, int Count)> GetUpcomingBillsSummaryAsync(
        Guid organizationId,
        DateOnly? from = null,
        DateOnly? to = null)
    {
        return await _billsRepository.GetUpcomingBillsSummaryAsync(organizationId, from, to);
    }

    public async Task<decimal> GetPaidBillsTotalAsync(Guid organizationId, DateOnly? from = null, DateOnly? to = null)
    {
        return await _billsRepository.GetPaidBillsTotalAsync(organizationId, from, to);
    }

    public async Task<Result<Bill>> CreateAsync(Guid organizationId, CreateBillData data)
    {
        var organization = await _organizationsRepository.GetWithoutRelationsAsync(organizationId);
        if (organization is null)
            return OrganizationNotFound(organizationId);

        var entitlement = PlanEntitlement.For(organization.EffectivePlanTier);
        var (monthStartUtc, monthEndUtc) = organization.GetCurrentMonthBoundariesUtc();
        var oneTimeBillCount = await _billsRepository.GetOneTimeMonthlyCountByOrganizationAsync(
            organizationId, monthStartUtc, monthEndUtc);
        var seriesCount = await _billSeriesRepository.GetMonthlyCountByOrganizationAsync(
            organizationId, monthStartUtc, monthEndUtc);

        if (oneTimeBillCount + seriesCount >= entitlement.MaxBillsPerMonth)
            return Error.PlanLimitExceeded($"Monthly bill limit of {entitlement.MaxBillsPerMonth} reached.");

        var dueDate = organization.GetLocalDate(data.DueDate);

        return data.Frequency is { } frequency
            ? await CreateSeriesAsync(organization, data, frequency, dueDate)
            : await CreateOneTimeBillAsync(organizationId, data, dueDate);
    }

    public async Task<Result<BillPage>> GetPageAsync(Guid organizationId, BillListQuery query)
    {
        var organization = await _organizationsRepository.GetWithoutRelationsAsync(organizationId);
        if (organization is null)
            return OrganizationNotFound(organizationId);

        DateOnly? fromDate = query.From.HasValue ? organization.GetLocalDate(query.From.Value) : null;
        DateOnly? toDate = query.To.HasValue ? organization.GetLocalDate(query.To.Value) : null;
        var (bills, totalCount, summary) = await _billsRepository.GetAllByOrganizationAsync(
            organizationId, query.Page, query.PageSize, organization.GetCurrentLocalDate(),
            fromDate, toDate, query.Statuses, query.Description, query.Type);

        return new BillPage(bills, totalCount, summary);
    }

    public async Task<Result<Bill>> GetByIdAsync(Guid organizationId, Guid billId)
    {
        var bill = await _billsRepository.GetByIdAsync(billId, organizationId);

        if (bill is null)
            return BillNotFound(billId);

        return bill;
    }

    public async Task<Result<Bill>> UpdateAsync(Guid organizationId, Guid billId, UpdateBillData data)
    {
        var bill = await _billsRepository.GetByIdAsync(billId, organizationId);
        if (bill is null)
            return BillNotFound(billId);

        var organization = await _organizationsRepository.GetWithoutRelationsAsync(organizationId);
        if (organization is null)
            return OrganizationNotFound(organizationId);

        var wasPaid = bill.Status == BillStatus.Paid;
        bill.Description = data.Description;
        if (data.Notes is not null)
            bill.Notes = NormalizeNotes(data.Notes);
        bill.Category = data.Category;
        bill.Status = data.Status;
        bill.DueDate = organization.GetLocalDate(data.DueDate);
        bill.PaymentDate = data.PaymentDate?.ToUniversalTime();
        bill.AmountDue = data.AmountDue;
        bill.AmountPaid = data.AmountPaid;

        await _billsRepository.UpdateAsync(bill,
            b => b.Description,
            b => b.Notes!,
            b => b.Category,
            b => b.Status,
            b => b.DueDate,
            b => b.PaymentDate,
            b => b.AmountDue,
            b => b.AmountPaid);

        BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Updated);
        if (!wasPaid && bill.Status == BillStatus.Paid)
            BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Paid);

        return bill;
    }

    public async Task<Result> DeleteAsync(Guid organizationId, Guid billId)
    {
        var bill = await _billsRepository.GetByIdAsync(billId, organizationId);
        if (bill is null)
            return BillNotFound(billId);

        foreach (var attachment in bill.Attachments)
        {
            await _attachmentService.DeleteAttachmentAsync(attachment.Id);
        }

        await _billsRepository.DeleteAsync(bill);
        BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Deleted);

        return Result.Success();
    }

    public async Task<List<BillSeries>> GetSeriesAsync(Guid organizationId)
    {
        return await _billSeriesRepository.GetAllByOrganizationWithNextBillAsync(organizationId);
    }

    public async Task<Result> StopSeriesAsync(Guid organizationId, Guid seriesId)
    {
        var series = await _billSeriesRepository.GetByIdAsync(seriesId);
        if (series is null || series.OrganizationId != organizationId)
            return Error.NotFound($"Bill series {seriesId} not found.");

        var organization = await _organizationsRepository.GetWithoutRelationsAsync(organizationId);
        if (organization is null)
            return OrganizationNotFound(organizationId);

        if (series.IsActive)
        {
            series.IsActive = false;
            series.StoppedAt = DateTime.UtcNow;

            await _billSeriesRepository.UpdateAsync(series,
                s => s.IsActive,
                s => s.StoppedAt);
            BusinessTelemetry.RecordDomainOperation(DomainEntities.BillSeries, DomainOperations.Stopped);
        }

        // Runs for already-stopped series too, so series stopped before future occurrences were removed get cleaned up.
        var futureBills = await _billsRepository.GetUnpaidSeriesBillsDueAfterAsync(
            series.Id, organization.GetCurrentLocalDate());

        foreach (var attachment in futureBills.SelectMany(b => b.Attachments).ToList())
        {
            await _attachmentService.DeleteAttachmentAsync(attachment.Id);
        }

        await _billsRepository.DeleteRangeAsync(futureBills);
        BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Deleted, futureBills.Count);

        // Cached occurrences embed the series, so drop them to expose the new IsActive state.
        await _billsRepository.RemoveSeriesBillsFromCacheAsync(series.Id);

        return Result.Success();
    }

    private async Task<Result<Bill>> CreateOneTimeBillAsync(Guid organizationId, CreateBillData data, DateOnly dueDate)
    {
        Bill bill = new()
        {
            Description = data.Description,
            Notes = NormalizeNotes(data.Notes),
            Category = data.Category,
            Status = data.Status,
            CreatedAt = DateTime.UtcNow,
            DueDate = dueDate,
            PaymentDate = data.PaymentDate?.ToUniversalTime(),
            AmountDue = data.AmountDue,
            AmountPaid = data.AmountPaid,
            OrganizationId = organizationId,
        };

        await _billsRepository.CreateAsync(bill);
        BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Created);
        if (bill.Status == BillStatus.Paid)
            BusinessTelemetry.RecordDomainOperation(DomainEntities.Bill, DomainOperations.Paid);

        return bill;
    }

    private async Task<Result<Bill>> CreateSeriesAsync(
        Organization organization, CreateBillData data, Frequency frequency, DateOnly startDate)
    {
        BillSeries series = new()
        {
            Id = Guid.NewGuid(),
            Description = data.Description,
            Notes = NormalizeNotes(data.Notes),
            Category = data.Category,
            Frequency = frequency,
            AmountDue = data.AmountDue,
            StartDate = startDate,
            TotalOccurrences = data.Installments,
            IsActive = true,
            NextOccurrenceNumber = 1,
            CreatedAt = DateTime.UtcNow,
            OrganizationId = organization.Id,
        };

        await _billSeriesRepository.CreateAsync(series);
        BusinessTelemetry.RecordDomainOperation(DomainEntities.BillSeries, DomainOperations.Created);

        var horizon = BillGenerationService.GetRollingHorizon(organization);
        await _billGenerationService.GenerateOccurrencesAsync(series, horizon, organization);

        var firstOccurrence = await _billsRepository.GetSeriesOccurrenceAsync(series.Id, occurrenceNumber: 1);

        // Without a stored first occurrence, describe the series itself; the empty id tells the caller no bill exists yet.
        firstOccurrence ??= new Bill
        {
            Id = Guid.Empty,
            Description = series.Description,
            Notes = series.Notes,
            Category = series.Category,
            Status = BillStatus.Upcoming,
            CreatedAt = series.CreatedAt,
            DueDate = series.StartDate,
            AmountDue = series.AmountDue,
            OrganizationId = series.OrganizationId,
            BillSeriesId = series.Id,
            TotalOccurrences = series.TotalOccurrences
        };
        firstOccurrence.BillSeries = series;

        return firstOccurrence;
    }

    private static Error BillNotFound(Guid billId) => Error.NotFound($"Bill {billId} not found.");

    private static Error OrganizationNotFound(Guid organizationId) =>
        Error.NotFound($"Organization {organizationId} not found.");

    private static string? NormalizeNotes(string? notes)
    {
        return string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }
}
