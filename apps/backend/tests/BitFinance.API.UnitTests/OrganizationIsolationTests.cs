using BitFinance.API.Controllers;
using BitFinance.API.Models.Request;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Caching;
using BitFinance.Data.Contexts;
using BitFinance.Data.Repositories;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

/// <summary>
/// A member of one organization must not reach another organization's bills or expenses by id.
/// </summary>
public class OrganizationIsolationTests : IDisposable
{
    private static readonly Guid OwnOrganizationId = Guid.NewGuid();
    private static readonly Guid OtherOrganizationId = Guid.NewGuid();

    private readonly ApplicationDbContext _dbContext;
    private readonly Mock<IAttachmentService> _attachmentService = new();
    private readonly BillsController _billsController;
    private readonly ExpensesController _expensesController;
    private readonly Bill _otherBill;
    private readonly Expense _otherExpense;

    public OrganizationIsolationTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        _dbContext = new ApplicationDbContext(options);

        var user = new User { Id = Guid.NewGuid().ToString(), FirstName = "Test", LastName = "User" };
        _otherBill = new Bill
        {
            Id = Guid.NewGuid(),
            OrganizationId = OtherOrganizationId,
            Description = "Other organization bill",
            Status = BillStatus.Upcoming,
            AmountDue = 100,
            DueDate = new DateOnly(2026, 1, 10),
            Attachments = [CreateAttachment()]
        };
        _otherExpense = new Expense
        {
            Id = Guid.NewGuid(),
            OrganizationId = OtherOrganizationId,
            Description = "Other organization expense",
            Status = ExpenseStatus.Paid,
            Amount = 50,
            OccurredAt = DateTime.UtcNow,
            CreatedByUser = user,
            Attachments = [CreateAttachment()]
        };

        _dbContext.AddRange(
            new Organization { Id = OwnOrganizationId, Name = "Own" },
            new Organization { Id = OtherOrganizationId, Name = "Other" },
            _otherBill,
            _otherExpense);
        _dbContext.SaveChanges();
        _dbContext.ChangeTracker.Clear();

        _billsController = new BillsController(
            _dbContext,
            Mock.Of<ILogger<BillsController>>(),
            new BillsRepository(new ConfigurationBuilder().Build(), _dbContext, Mock.Of<ICacheService>()),
            new BillSeriesRepository(_dbContext),
            Mock.Of<IBillGenerationService>(),
            _attachmentService.Object,
            new OrganizationsRepository(_dbContext));
        _expensesController = new ExpensesController(
            Mock.Of<ILogger<ExpensesController>>(),
            new ExpensesRepository(_dbContext),
            Mock.Of<IExpensesService>(),
            _attachmentService.Object);
    }

    public void Dispose() => _dbContext.Dispose();

    [Fact]
    public async Task GetBillById_BillFromAnotherOrganization_ReturnsNotFound()
    {
        var result = await _billsController.GetBillById(OwnOrganizationId, _otherBill.Id);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetBillById_BillFromSameOrganization_ReturnsBill()
    {
        var result = await _billsController.GetBillById(OtherOrganizationId, _otherBill.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(_otherBill.Id, Assert.IsType<GetBillResponse>(ok.Value).Id);
    }

    [Fact]
    public async Task UpdateBill_BillFromAnotherOrganization_ReturnsNotFoundAndKeepsBill()
    {
        var request = new UpdateBillRequest(
            "Hijacked", _otherBill.Category.ToString(), nameof(BillStatus.Paid),
            new DateTime(2026, 2, 1), null, 1, 1);

        var result = await _billsController.UpdateBill(OwnOrganizationId, _otherBill.Id, request);

        Assert.IsType<NotFoundResult>(result.Result);
        var stored = await _dbContext.Bills.AsNoTracking().SingleAsync(bill => bill.Id == _otherBill.Id);
        Assert.Equal("Other organization bill", stored.Description);
        Assert.Equal(BillStatus.Upcoming, stored.Status);
    }

    [Fact]
    public async Task UpdateBill_BillFromSameOrganization_UpdatesBill()
    {
        var request = new UpdateBillRequest(
            "Renamed", _otherBill.Category.ToString(), nameof(BillStatus.Upcoming),
            new DateTime(2026, 2, 1), null, 120, null);

        var result = await _billsController.UpdateBill(OtherOrganizationId, _otherBill.Id, request);

        Assert.IsType<OkObjectResult>(result.Result);
        var stored = await _dbContext.Bills.AsNoTracking().SingleAsync(bill => bill.Id == _otherBill.Id);
        Assert.Equal("Renamed", stored.Description);
    }

    [Fact]
    public async Task DeleteBillById_BillFromAnotherOrganization_ReturnsNotFoundAndKeepsBill()
    {
        var result = await _billsController.DeleteBillById(OwnOrganizationId, _otherBill.Id);

        Assert.IsType<NotFoundResult>(result);
        Assert.True(await _dbContext.Bills.AnyAsync(bill => bill.Id == _otherBill.Id));
        _attachmentService.Verify(service => service.DeleteAttachmentAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Fact]
    public async Task GetBillDocument_BillFromAnotherOrganization_ReturnsNotFound()
    {
        var result = await _billsController.GetDocument(
            OwnOrganizationId, _otherBill.Id, _otherBill.Attachments.First().Id);

        Assert.IsType<NotFoundResult>(result);
        _attachmentService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task GetExpenseById_ExpenseFromAnotherOrganization_ReturnsNotFound()
    {
        var result = await _expensesController.GetExpenseById(OwnOrganizationId, _otherExpense.Id);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task GetExpenseById_ExpenseFromSameOrganization_ReturnsExpense()
    {
        var result = await _expensesController.GetExpenseById(OtherOrganizationId, _otherExpense.Id);

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        Assert.Equal(_otherExpense.Id, Assert.IsType<GetExpenseResponse>(ok.Value).Id);
    }

    [Fact]
    public async Task UpdateExpense_ExpenseFromAnotherOrganization_ReturnsNotFoundAndKeepsExpense()
    {
        var request = new UpdateExpenseRequest(
            "Hijacked", _otherExpense.Category.ToString(), 1, nameof(ExpenseStatus.Cancelled), null);

        var result = await _expensesController.UpdateExpense(OwnOrganizationId, _otherExpense.Id, request);

        Assert.IsType<NotFoundResult>(result.Result);
        var stored = await _dbContext.Expenses.AsNoTracking().SingleAsync(expense => expense.Id == _otherExpense.Id);
        Assert.Equal("Other organization expense", stored.Description);
        Assert.Equal(50, stored.Amount);
    }

    [Fact]
    public async Task DeleteExpenseById_ExpenseFromAnotherOrganization_ReturnsNotFoundAndKeepsExpense()
    {
        var result = await _expensesController.DeleteExpenseById(OwnOrganizationId, _otherExpense.Id);

        Assert.IsType<NotFoundResult>(result);
        Assert.True(await _dbContext.Expenses.AnyAsync(expense => expense.Id == _otherExpense.Id));
        _attachmentService.Verify(service => service.DeleteAttachmentAsync(It.IsAny<Guid>()), Times.Never);
    }

    private static Attachment CreateAttachment()
    {
        return new Attachment
        {
            Id = Guid.NewGuid(),
            FileName = "document.pdf",
            OriginalFileName = "document.pdf",
            ContentType = "application/pdf",
            StoragePath = "documents/document.pdf"
        };
    }
}
