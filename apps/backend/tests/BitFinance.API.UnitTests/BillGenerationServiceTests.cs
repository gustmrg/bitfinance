using System.Linq.Expressions;
using BitFinance.API.Services;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class BillGenerationServiceTests
{
    [Fact]
    public async Task GenerateOccurrencesAsync_CopiesSeriesNotesToEveryOccurrence()
    {
        var billsRepository = new Mock<IBillsRepository>();
        var seriesRepository = new Mock<IBillSeriesRepository>();
        List<Bill> createdBills = [];

        billsRepository
            .Setup(repository => repository.CreateRangeAsync(It.IsAny<List<Bill>>()))
            .Callback<List<Bill>>(bills => createdBills = bills)
            .Returns(Task.CompletedTask);
        seriesRepository
            .Setup(repository => repository.UpdateAsync(
                It.IsAny<BillSeries>(),
                It.IsAny<Expression<Func<BillSeries, object>>[]>()))
            .Returns(Task.CompletedTask);

        var organization = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "Test organization",
            TimeZoneId = "UTC"
        };
        var series = new BillSeries
        {
            Id = Guid.NewGuid(),
            Description = "Installment",
            Notes = "Keep the receipt for reimbursement.",
            Category = BillCategory.Services,
            Frequency = Frequency.Monthly,
            AmountDue = 50,
            StartDate = organization.GetCurrentLocalDate(),
            TotalOccurrences = 3,
            OrganizationId = organization.Id
        };
        var service = new BillGenerationService(billsRepository.Object, seriesRepository.Object);

        var count = await service.GenerateOccurrencesAsync(
            series,
            series.StartDate.AddMonths(12),
            organization);

        Assert.Equal(3, count);
        Assert.All(createdBills, bill => Assert.Equal(series.Notes, bill.Notes));
        Assert.Equal(4, series.NextOccurrenceNumber);
    }
}
