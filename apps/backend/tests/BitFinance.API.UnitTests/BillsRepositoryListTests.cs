using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Caching;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

/// <summary>
/// The bill listing filters and totals are computed over every matching bill, not over one page.
/// </summary>
public class BillsRepositoryListTests : IDisposable
{
    private static readonly Guid OrganizationId = Guid.NewGuid();
    private static readonly DateOnly Today = new(2026, 6, 15);

    private readonly ApplicationDbContext _dbContext;
    private readonly BillsRepository _repository;

    public BillsRepositoryListTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        _dbContext.AddRange(
            NewBill("Due this week", BillStatus.Upcoming, new DateOnly(2026, 6, 18), 100),
            NewBill("Overdue recurring", BillStatus.Overdue, new DateOnly(2026, 6, 10), 50,
                seriesId: Guid.NewGuid()),
            NewBill("Past due installment", BillStatus.Upcoming, new DateOnly(2026, 6, 12), 30,
                seriesId: Guid.NewGuid(), totalOccurrences: 3),
            NewBill("Paid", BillStatus.Paid, new DateOnly(2026, 6, 5), 80, amountPaid: 75),
            NewBill("Cancelled", BillStatus.Cancelled, new DateOnly(2026, 6, 16), 200),
            NewBill("Due later", BillStatus.Upcoming, new DateOnly(2026, 6, 30), 40),
            NewBill("Other organization", BillStatus.Overdue, new DateOnly(2026, 6, 1), 999,
                organizationId: Guid.NewGuid()));
        _dbContext.SaveChanges();
        _dbContext.ChangeTracker.Clear();

        _repository = new BillsRepository(
            new ConfigurationBuilder().Build(), _dbContext, Mock.Of<ICacheService>());
    }

    public void Dispose() => _dbContext.Dispose();

    [Fact]
    public async Task GetAllByOrganizationAsync_SummaryCoversBillsOutsideTheReturnedPage()
    {
        var (items, totalCount, summary) = await _repository.GetAllByOrganizationAsync(
            OrganizationId, page: 1, pageSize: 2, Today);

        Assert.Equal(2, items.Count);
        Assert.Equal(6, totalCount);
        Assert.Equal(220, summary.ToPay);
        Assert.Equal(80, summary.Overdue);
        Assert.Equal(100, summary.NextSevenDays);
        Assert.Equal(75, summary.Paid);
    }

    [Theory]
    [InlineData(BillTypeFilter.OneTime, 4)]
    [InlineData(BillTypeFilter.Recurring, 1)]
    [InlineData(BillTypeFilter.Installment, 1)]
    public async Task GetAllByOrganizationAsync_TypeFilter_ReturnsOnlyBillsOfThatType(
        BillTypeFilter type, int expectedCount)
    {
        var (items, totalCount, _) = await _repository.GetAllByOrganizationAsync(
            OrganizationId, page: 1, pageSize: 50, Today, type: type);

        Assert.Equal(expectedCount, totalCount);
        Assert.All(items, bill =>
        {
            var actual = bill.BillSeriesId is null
                ? BillTypeFilter.OneTime
                : bill.TotalOccurrences is null ? BillTypeFilter.Recurring : BillTypeFilter.Installment;
            Assert.Equal(type, actual);
        });
    }

    [Fact]
    public async Task GetAllByOrganizationAsync_TypeFilter_NarrowsTheSummary()
    {
        var (_, _, summary) = await _repository.GetAllByOrganizationAsync(
            OrganizationId, page: 1, pageSize: 50, Today, type: BillTypeFilter.Installment);

        Assert.Equal(new BillListSummary(ToPay: 30, Overdue: 30, NextSevenDays: 0, Paid: 0), summary);
    }

    [Fact]
    public async Task GetAllByOrganizationAsync_SeveralStatuses_ReturnsBillsInAnyOfThem()
    {
        var (items, totalCount, _) = await _repository.GetAllByOrganizationAsync(
            OrganizationId, page: 1, pageSize: 50, Today,
            statuses: [BillStatus.Created, BillStatus.Upcoming, BillStatus.Due, BillStatus.Overdue]);

        Assert.Equal(4, totalCount);
        Assert.DoesNotContain(items, bill => bill.Status is BillStatus.Paid or BillStatus.Cancelled);
    }

    [Fact]
    public async Task GetAllByOrganizationAsync_NoMatchingBills_ReturnsEmptySummary()
    {
        var (items, totalCount, summary) = await _repository.GetAllByOrganizationAsync(
            Guid.NewGuid(), page: 1, pageSize: 50, Today);

        Assert.Empty(items);
        Assert.Equal(0, totalCount);
        Assert.Equal(BillListSummary.Empty, summary);
    }

    private static Bill NewBill(
        string description, BillStatus status, DateOnly dueDate, decimal amountDue,
        decimal? amountPaid = null, Guid? seriesId = null, int? totalOccurrences = null,
        Guid? organizationId = null)
    {
        return new Bill
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId ?? OrganizationId,
            Description = description,
            Status = status,
            DueDate = dueDate,
            AmountDue = amountDue,
            AmountPaid = amountPaid,
            BillSeriesId = seriesId,
            TotalOccurrences = totalOccurrences
        };
    }
}
