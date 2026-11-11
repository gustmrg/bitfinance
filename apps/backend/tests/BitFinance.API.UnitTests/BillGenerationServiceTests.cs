using BitFinance.API.Services;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class BillGenerationServiceTests
{
    private readonly Mock<IBillSeriesRepository> _seriesRepository = new();
    private readonly Organization _organization = new()
    {
        Id = Guid.NewGuid(),
        Name = "Test organization",
        TimeZoneId = "UTC"
    };

    [Fact]
    public async Task GenerateOccurrencesAsync_CopiesSeriesNotesToEveryOccurrence()
    {
        List<Bill> createdBills = [];
        _seriesRepository
            .Setup(repository => repository.TryAddOccurrencesAsync(
                It.IsAny<BillSeries>(), It.IsAny<List<Bill>>(), It.IsAny<int>()))
            .Callback<BillSeries, List<Bill>, int>((_, bills, _) => createdBills = bills)
            .ReturnsAsync(true);
        var series = CreateSeries();

        var count = await CreateService().GenerateOccurrencesAsync(
            series,
            series.StartDate.AddMonths(12),
            _organization);

        Assert.Equal(3, count);
        Assert.All(createdBills, bill => Assert.Equal(series.Notes, bill.Notes));
    }

    [Fact]
    public async Task GenerateOccurrencesAsync_SavesOccurrencesAndSeriesCounterInOneCall()
    {
        _seriesRepository
            .Setup(repository => repository.TryAddOccurrencesAsync(
                It.IsAny<BillSeries>(), It.IsAny<List<Bill>>(), It.IsAny<int>()))
            .ReturnsAsync(true);
        var series = CreateSeries();

        await CreateService().GenerateOccurrencesAsync(series, series.StartDate.AddMonths(12), _organization);

        _seriesRepository.Verify(repository => repository.TryAddOccurrencesAsync(
            series,
            It.Is<List<Bill>>(bills =>
                bills.Select(bill => bill.OccurrenceNumber).SequenceEqual(new int?[] { 1, 2, 3 })
                && bills.All(bill => bill.BillSeriesId == series.Id)),
            4), Times.Once);
        _seriesRepository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GenerateOccurrencesAsync_WhenAnotherWriterAlreadyGenerated_ReturnsZero()
    {
        _seriesRepository
            .Setup(repository => repository.TryAddOccurrencesAsync(
                It.IsAny<BillSeries>(), It.IsAny<List<Bill>>(), It.IsAny<int>()))
            .ReturnsAsync(false);
        var series = CreateSeries();

        var count = await CreateService().GenerateOccurrencesAsync(
            series,
            series.StartDate.AddMonths(12),
            _organization);

        Assert.Equal(0, count);
    }

    [Fact]
    public async Task GenerateOccurrencesAsync_CompletedSeries_SavesNothing()
    {
        var series = CreateSeries();
        series.NextOccurrenceNumber = 4;

        var count = await CreateService().GenerateOccurrencesAsync(
            series,
            series.StartDate.AddMonths(12),
            _organization);

        Assert.Equal(0, count);
        _seriesRepository.VerifyNoOtherCalls();
    }

    private BillGenerationService CreateService() => new(_seriesRepository.Object);

    private BillSeries CreateSeries()
    {
        return new BillSeries
        {
            Id = Guid.NewGuid(),
            Description = "Installment",
            Notes = "Keep the receipt for reimbursement.",
            Category = BillCategory.Services,
            Frequency = Frequency.Monthly,
            AmountDue = 50,
            StartDate = _organization.GetCurrentLocalDate(),
            TotalOccurrences = 3,
            IsActive = true,
            NextOccurrenceNumber = 1,
            OrganizationId = _organization.Id
        };
    }
}
