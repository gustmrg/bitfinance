using BitFinance.API.Controllers;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class ExpensesControllerTests
{
    private readonly Mock<IExpensesRepository> _expensesRepository = new();
    private readonly ExpensesController _controller;

    public ExpensesControllerTests()
    {
        _controller = new ExpensesController(
            Mock.Of<ILogger<ExpensesController>>(),
            _expensesRepository.Object,
            Mock.Of<IOrganizationsRepository>(),
            Mock.Of<IAttachmentService>());
    }

    [Fact]
    public async Task GetExpenses_UsesFilteredTotalsAndMapsMetadata()
    {
        var organizationId = Guid.NewGuid();
        var expense = new Expense
        {
            Id = Guid.NewGuid(),
            OrganizationId = organizationId,
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
                organizationId,
                2,
                20,
                It.IsAny<DateTime?>(),
                It.IsAny<DateTime?>(),
                ExpenseStatus.Paid,
                "lunch",
                PaymentMethod.Pix))
            .ReturnsAsync(([expense], 25, 750));

        var result = await _controller.GetExpenses(
            organizationId,
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
}
