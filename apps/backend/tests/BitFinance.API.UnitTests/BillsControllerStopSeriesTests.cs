using BitFinance.API.Controllers;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class BillsControllerStopSeriesTests
{
    private static readonly Guid OrganizationId = Guid.NewGuid();

    private readonly Mock<IBillsRepository> _billsRepository = new();
    private readonly Mock<IBillSeriesRepository> _billSeriesRepository = new();
    private readonly Mock<IAttachmentService> _attachmentService = new();
    private readonly Mock<IOrganizationsRepository> _organizationsRepository = new();
    private readonly BillsController _controller;

    public BillsControllerStopSeriesTests()
    {
        _organizationsRepository
            .Setup(repository => repository.GetByIdAsync(OrganizationId))
            .ReturnsAsync(new Organization { Id = OrganizationId, TimeZoneId = "America/Fortaleza" });

        _controller = new BillsController(
            null!,
            Mock.Of<ILogger<BillsController>>(),
            _billsRepository.Object,
            _billSeriesRepository.Object,
            Mock.Of<IBillGenerationService>(),
            _attachmentService.Object,
            _organizationsRepository.Object);
    }

    [Fact]
    public async Task StopBillSeries_ActiveSeries_StopsSeriesAndDeletesFutureUnpaidBills()
    {
        var series = CreateSeries(isActive: true);
        var attachmentId = Guid.NewGuid();
        var futureBills = new List<Bill>
        {
            new() { Id = Guid.NewGuid(), Attachments = [new Attachment { Id = attachmentId }] },
            new() { Id = Guid.NewGuid() }
        };
        _billsRepository
            .Setup(repository => repository.GetUnpaidSeriesBillsDueAfterAsync(series.Id, It.IsAny<DateOnly>()))
            .ReturnsAsync(futureBills);

        var result = await _controller.StopBillSeriesAsync(OrganizationId, series.Id);

        Assert.IsType<NoContentResult>(result);
        Assert.False(series.IsActive);
        Assert.NotNull(series.StoppedAt);
        _attachmentService.Verify(service => service.DeleteAttachmentAsync(attachmentId), Times.Once);
        _billsRepository.Verify(repository => repository.DeleteRangeAsync(futureBills), Times.Once);
        _billsRepository.Verify(repository => repository.RemoveSeriesBillsFromCacheAsync(series.Id), Times.Once);
    }

    [Fact]
    public async Task StopBillSeries_AlreadyStoppedSeries_StillDeletesFutureUnpaidBills()
    {
        var series = CreateSeries(isActive: false);
        var futureBills = new List<Bill> { new() { Id = Guid.NewGuid() } };
        _billsRepository
            .Setup(repository => repository.GetUnpaidSeriesBillsDueAfterAsync(series.Id, It.IsAny<DateOnly>()))
            .ReturnsAsync(futureBills);

        var result = await _controller.StopBillSeriesAsync(OrganizationId, series.Id);

        Assert.IsType<NoContentResult>(result);
        _billSeriesRepository.Verify(repository => repository.UpdateAsync(
            It.IsAny<BillSeries>(),
            It.IsAny<System.Linq.Expressions.Expression<Func<BillSeries, object>>[]>()), Times.Never);
        _billsRepository.Verify(repository => repository.DeleteRangeAsync(futureBills), Times.Once);
    }

    [Fact]
    public async Task StopBillSeries_SeriesFromAnotherOrganization_ReturnsNotFound()
    {
        var series = CreateSeries(isActive: true);
        series.OrganizationId = Guid.NewGuid();

        var result = await _controller.StopBillSeriesAsync(OrganizationId, series.Id);

        Assert.IsType<NotFoundResult>(result);
        Assert.True(series.IsActive);
        _billsRepository.Verify(repository => repository.DeleteRangeAsync(It.IsAny<List<Bill>>()), Times.Never);
    }

    private BillSeries CreateSeries(bool isActive)
    {
        var series = new BillSeries
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrganizationId,
            Description = "Internet",
            IsActive = isActive
        };
        _billSeriesRepository
            .Setup(repository => repository.GetByIdAsync(series.Id))
            .ReturnsAsync(series);
        return series;
    }
}
