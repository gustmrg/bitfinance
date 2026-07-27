using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class BillGenerationService : IBillGenerationService
{
    public const int RollingHorizonMonths = 12;
    private readonly IBillsRepository _billsRepository;
    private readonly IBillSeriesRepository _billSeriesRepository;

    public BillGenerationService(IBillsRepository billsRepository, IBillSeriesRepository billSeriesRepository)
    {
        _billsRepository = billsRepository;
        _billSeriesRepository = billSeriesRepository;
    }

    public async Task<int> GenerateOccurrencesAsync(BillSeries series, DateOnly horizonDate, Organization organization)
    {
        if (!series.IsActive)
            return 0;

        var today = organization.GetCurrentLocalDate();
        var bills = new List<Bill>();
        var occurrenceNumber = series.NextOccurrenceNumber;

        while (ShouldGenerate(series, occurrenceNumber))
        {
            var dueDate = ComputeDueDate(series.StartDate, series.Frequency, occurrenceNumber - 1);

            if (dueDate > horizonDate && occurrenceNumber > 1)
                break;

            bills.Add(new Bill
            {
                Id = Guid.NewGuid(),
                Description = series.Description,
                Notes = series.Notes,
                Category = series.Category,
                Status = ComputeStatus(dueDate, today),
                AmountDue = series.AmountDue,
                DueDate = dueDate,
                CreatedAt = DateTime.UtcNow,
                OrganizationId = series.OrganizationId,
                BillSeriesId = series.Id,
                OccurrenceNumber = occurrenceNumber,
                TotalOccurrences = series.TotalOccurrences
            });

            occurrenceNumber++;
        }

        if (bills.Count == 0)
            return 0;

        await _billsRepository.CreateRangeAsync(bills);

        series.NextOccurrenceNumber = occurrenceNumber;
        await _billSeriesRepository.UpdateAsync(series,
            s => s.NextOccurrenceNumber);

        return bills.Count;
    }

    /// <summary>
    /// Returns the rolling generation horizon (today + 12 months) for an organization.
    /// </summary>
    public static DateOnly GetRollingHorizon(Organization organization)
    {
        return organization.GetCurrentLocalDate().AddMonths(RollingHorizonMonths);
    }

    private static bool ShouldGenerate(BillSeries series, int occurrenceNumber)
    {
        if (series.TotalOccurrences is { } total && occurrenceNumber > total)
            return false;

        return true;
    }

    internal static DateOnly ComputeDueDate(DateOnly startDate, Frequency frequency, int offset)
    {
        return frequency switch
        {
            Frequency.Daily => startDate.AddDays(offset),
            Frequency.Weekly => startDate.AddDays(offset * 7),
            Frequency.Monthly => startDate.AddMonths(offset),
            Frequency.Annually => startDate.AddYears(offset),
            _ => startDate.AddDays(offset)
        };
    }

    internal static BillStatus ComputeStatus(DateOnly dueDate, DateOnly today)
    {
        if (dueDate < today)
            return BillStatus.Overdue;

        if (dueDate == today)
            return BillStatus.Due;

        return BillStatus.Upcoming;
    }
}
