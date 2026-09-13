using BitFinance.API.Controllers;
using BitFinance.API.Models;
using BitFinance.API.Models.Request;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class ExpensesControllerTests
{
    private static readonly Guid OrganizationId = Guid.NewGuid();

    private readonly Mock<IExpensesRepository> _expensesRepository = new();
    private readonly Mock<IExpensesService> _expensesService = new();
    private readonly ExpensesController _controller;

    public ExpensesControllerTests()
    {
        _controller = new ExpensesController(
            Mock.Of<ILogger<ExpensesController>>(),
            _expensesRepository.Object,
            _expensesService.Object,
            Mock.Of<IAttachmentService>());
    }

    [Fact]
    public async Task GetExpenses_UsesFilteredTotalsAndMapsMetadata()
    {
        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrganizationId,
            Description = "Office lunch",
            Notes = "Client meeting",
            Category = ExpenseCategory.Food,
            Status = ExpenseStatus.Paid,
            PaymentMethod = PaymentMethod.Pix,
            Amount = 75,
            OccurredAt = DateTime.UtcNow,
            CreatedByUser = new User { FirstName = "Test", LastName = "User" }
        };
        _expensesRepository
            .Setup(repository => repository.GetAllByOrganizationAsync(
                OrganizationId,
                2,
                20,
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                ExpenseStatus.Paid,
                "lunch",
                PaymentMethod.Pix))
            .ReturnsAsync(([expense], 25, 750));

        var result = await _controller.GetExpenses(
            OrganizationId,
            page: 2,
            pageSize: 20,
            status: "paid",
            description: "lunch",
            paymentMethod: "pix");

        var ok = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<ExpensePageResponse>(ok.Value);
        Assert.Equal(25, response.TotalRecords);
        Assert.Equal(2, response.TotalPages);
        Assert.Equal(750, response.Summary.TotalAmount);
        Assert.Equal(30, response.Summary.AverageAmount);
        Assert.Equal(PaymentMethod.Pix, Assert.Single(response.Data).PaymentMethod);
        Assert.Equal("Client meeting", response.Data[0].Notes);
    }

    [Fact]
    public async Task GetExpenses_InvalidPaymentMethod_ReturnsBadRequest()
    {
        var result = await _controller.GetExpenses(
            Guid.NewGuid(),
            paymentMethod: "crypto");

        Assert.IsType<BadRequestObjectResult>(result.Result);
        _expensesRepository.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateExpense_ValidRequest_CreatesThroughServiceAndReturnsCreated()
    {
        var expense = NewExpense("Groceries");
        _expensesService
            .Setup(service => service.CreateExpenseAsync(OrganizationId, It.IsAny<CreateExpenseData>()))
            .ReturnsAsync(expense);
        var request = new CreateExpenseRequest(
            "Groceries", "food", 120.50m, "paid",
            OccurredAt: new DateTime(2026, 9, 10, 12, 0, 0, DateTimeKind.Utc),
            CreatedBy: Guid.NewGuid().ToString(),
            Notes: " weekly ", PaymentMethod: "pix");

        var result = await _controller.CreateExpenseAsync(OrganizationId, request);

        var created = Assert.IsType<CreatedAtActionResult>(result.Result);
        var response = Assert.IsType<CreateExpenseResponse>(created.Value);
        Assert.Equal(expense.Id, response.Id);
        Assert.Equal("Test User", response.CreatedBy);
        Assert.Equal(PaymentMethod.Pix, response.PaymentMethod);
        _expensesService.Verify(service => service.CreateExpenseAsync(
                OrganizationId,
                It.Is<CreateExpenseData>(data =>
                    data.Description == "Groceries" &&
                    data.Category == ExpenseCategory.Food &&
                    data.Status == ExpenseStatus.Paid &&
                    data.PaymentMethod == PaymentMethod.Pix &&
                    data.Notes == " weekly ")),
            Times.Once);
    }

    [Fact]
    public async Task CreateExpense_InvalidCategory_ReturnsUnprocessableEntityWithoutCallingService()
    {
        var request = new CreateExpenseRequest(
            "Groceries", "not-a-category", 10m, "paid", null, Guid.NewGuid().ToString());

        var result = await _controller.CreateExpenseAsync(OrganizationId, request);

        Assert.IsType<UnprocessableEntityObjectResult>(result.Result);
        _expensesService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateExpense_WhenOrganizationMissing_ReturnsNotFound()
    {
        _expensesService
            .Setup(service => service.CreateExpenseAsync(OrganizationId, It.IsAny<CreateExpenseData>()))
            .ThrowsAsync(new KeyNotFoundException());
        var request = new CreateExpenseRequest(
            "Groceries", "food", 10m, "paid", null, Guid.NewGuid().ToString());

        var result = await _controller.CreateExpenseAsync(OrganizationId, request);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateExpense_WhenMonthlyLimitReached_ReturnsForbiddenWithError()
    {
        _expensesService
            .Setup(service => service.CreateExpenseAsync(OrganizationId, It.IsAny<CreateExpenseData>()))
            .ThrowsAsync(new PlanLimitExceededException("Monthly expense limit of 20 reached."));
        var request = new CreateExpenseRequest(
            "Groceries", "food", 10m, "paid", null, Guid.NewGuid().ToString());

        var result = await _controller.CreateExpenseAsync(OrganizationId, request);

        var forbidden = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
    }

    [Fact]
    public async Task CreateExpensesBatch_ValidRequest_CreatesAllThroughServiceAndReturnsCreated()
    {
        var expenses = new List<Expense> { NewExpense("Rent"), NewExpense("Utilities") };
        _expensesService
            .Setup(service => service.CreateExpensesAsync(OrganizationId, It.IsAny<IReadOnlyList<CreateExpenseData>>()))
            .ReturnsAsync(expenses);
        var request = new CreateExpensesBatchRequest(
            Guid.NewGuid().ToString(),
            [
                new CreateExpenseBatchItemRequest("Rent", "housing", 1500m, "pending", null),
                new CreateExpenseBatchItemRequest(
                    "Utilities", "utilities", 200m, "paid",
                    OccurredAt: new DateTime(2026, 9, 11, 8, 0, 0, DateTimeKind.Utc),
                    PaymentMethod: "debitCard"),
            ]);

        var result = await _controller.CreateExpensesBatchAsync(OrganizationId, request);

        var created = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status201Created, created.StatusCode);
        var response = Assert.IsType<CreateExpensesBatchResponse>(created.Value);
        Assert.Equal(2, response.Data.Count);
        Assert.All(response.Data, item => Assert.Equal("Test User", item.CreatedBy));
        _expensesService.Verify(service => service.CreateExpensesAsync(
                OrganizationId,
                It.Is<IReadOnlyList<CreateExpenseData>>(items =>
                    items.Count == 2 &&
                    items[0].Category == ExpenseCategory.Housing &&
                    items[1].PaymentMethod == PaymentMethod.DebitCard)),
            Times.Once);
    }

    [Fact]
    public async Task CreateExpensesBatch_EmptyItems_ReturnsUnprocessableEntityWithoutCallingService()
    {
        var request = new CreateExpensesBatchRequest(Guid.NewGuid().ToString(), []);

        var result = await _controller.CreateExpensesBatchAsync(OrganizationId, request);

        Assert.IsType<UnprocessableEntityObjectResult>(result.Result);
        _expensesService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateExpensesBatch_OversizedBatch_ReturnsUnprocessableEntityWithoutCallingService()
    {
        var items = Enumerable.Range(0, 101)
            .Select(_ => new CreateExpenseBatchItemRequest("Rent", "housing", 1500m, "pending", null))
            .ToList();
        var request = new CreateExpensesBatchRequest(Guid.NewGuid().ToString(), items);

        var result = await _controller.CreateExpensesBatchAsync(OrganizationId, request);

        Assert.IsType<UnprocessableEntityObjectResult>(result.Result);
        _expensesService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateExpensesBatch_InvalidItem_ReturnsUnprocessableEntityWithIndex()
    {
        var request = new CreateExpensesBatchRequest(
            Guid.NewGuid().ToString(),
            [
                new CreateExpenseBatchItemRequest("Rent", "housing", 1500m, "pending", null),
                new CreateExpenseBatchItemRequest("Utilities", "not-a-category", 200m, "paid", null),
            ]);

        var result = await _controller.CreateExpensesBatchAsync(OrganizationId, request);

        var unprocessable = Assert.IsType<UnprocessableEntityObjectResult>(result.Result);
        Assert.Contains("index 1", unprocessable.Value!.ToString());
        _expensesService.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task CreateExpensesBatch_WhenOrganizationMissing_ReturnsNotFound()
    {
        _expensesService
            .Setup(service => service.CreateExpensesAsync(OrganizationId, It.IsAny<IReadOnlyList<CreateExpenseData>>()))
            .ThrowsAsync(new KeyNotFoundException());
        var request = new CreateExpensesBatchRequest(
            Guid.NewGuid().ToString(),
            [new CreateExpenseBatchItemRequest("Rent", "housing", 1500m, "pending", null)]);

        var result = await _controller.CreateExpensesBatchAsync(OrganizationId, request);

        Assert.IsType<NotFoundResult>(result.Result);
    }

    [Fact]
    public async Task CreateExpensesBatch_WhenBatchWouldExceedMonthlyLimit_ReturnsForbiddenWithError()
    {
        _expensesService
            .Setup(service => service.CreateExpensesAsync(OrganizationId, It.IsAny<IReadOnlyList<CreateExpenseData>>()))
            .ThrowsAsync(new PlanLimitExceededException("Creating 5 expenses would exceed the monthly limit of 20."));
        var request = new CreateExpensesBatchRequest(
            Guid.NewGuid().ToString(),
            [new CreateExpenseBatchItemRequest("Rent", "housing", 1500m, "pending", null)]);

        var result = await _controller.CreateExpensesBatchAsync(OrganizationId, request);

        var forbidden = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status403Forbidden, forbidden.StatusCode);
    }

    private static Expense NewExpense(string description)
    {
        return new Expense
        {
            Id = Guid.NewGuid(),
            OrganizationId = OrganizationId,
            Description = description,
            Category = ExpenseCategory.Housing,
            Status = ExpenseStatus.Paid,
            PaymentMethod = PaymentMethod.Pix,
            Amount = 100,
            OccurredAt = DateTime.UtcNow,
            CreatedByUser = new User { FirstName = "Test", LastName = "User" }
        };
    }
}
