using BitFinance.API.Models;
using BitFinance.API.Services;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;
using Moq;
using Xunit;

namespace BitFinance.API.UnitTests;

public class ExpensesServiceTests
{
    private static readonly Guid OrganizationId = Guid.NewGuid();
    private static readonly string UserId = Guid.NewGuid().ToString();

    private readonly Mock<IExpensesRepository> _expensesRepository = new();
    private readonly Mock<IOrganizationsRepository> _organizationsRepository = new();
    private readonly Mock<IUsersRepository> _usersRepository = new();
    private readonly ExpensesService _service;

    public ExpensesServiceTests()
    {
        _service = new ExpensesService(
            _expensesRepository.Object,
            _organizationsRepository.Object,
            _usersRepository.Object);
    }

    [Fact]
    public async Task CreateExpenseAsync_CreatesExpenseWithCreatedByUserPopulated()
    {
        SetupOrganization(PlanTier.Premium);
        SetupMonthlyCount(0);
        SetupUser(UserId);
        Expense? created = null;
        _expensesRepository
            .Setup(repository => repository.CreateAsync(It.IsAny<Expense>()))
            .Callback<Expense>(expense => created = expense)
            .ReturnsAsync((Expense expense) => expense);

        var expense = await _service.CreateExpenseAsync(OrganizationId, NewExpenseData());

        Assert.NotNull(created);
        Assert.Equal(OrganizationId, created!.OrganizationId);
        Assert.Equal("Test User", expense.CreatedByUser.FullName);
        Assert.Equal(ExpenseCategory.Food, expense.Category);
        Assert.Null(expense.Notes);
    }

    [Fact]
    public async Task CreateExpenseAsync_WhenMonthlyLimitReached_ThrowsPlanLimitExceededException()
    {
        SetupOrganization(PlanTier.Free);
        SetupMonthlyCount(20);

        await Assert.ThrowsAsync<PlanLimitExceededException>(
            () => _service.CreateExpenseAsync(OrganizationId, NewExpenseData()));
    }

    [Fact]
    public async Task CreateExpenseAsync_WhenOrganizationMissing_ThrowsKeyNotFoundException()
    {
        _organizationsRepository
            .Setup(repository => repository.GetByIdAsync(OrganizationId))
            .ReturnsAsync((Organization?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.CreateExpenseAsync(OrganizationId, NewExpenseData()));
    }

    [Fact]
    public async Task CreateExpenseAsync_WhenCreatingUserMissing_ThrowsKeyNotFoundException()
    {
        SetupOrganization(PlanTier.Premium);
        SetupMonthlyCount(0);
        _usersRepository
            .Setup(repository => repository.GetByIdAsync(UserId))
            .ReturnsAsync((User?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.CreateExpenseAsync(OrganizationId, NewExpenseData()));
    }

    [Fact]
    public async Task CreateExpensesAsync_CreatesAllExpensesWithCreatedByUserPopulated()
    {
        SetupOrganization(PlanTier.Basic);
        SetupMonthlyCount(0);
        SetupUser(UserId);
        List<Expense>? createdRange = null;
        _expensesRepository
            .Setup(repository => repository.CreateRangeAsync(It.IsAny<List<Expense>>()))
            .Callback<List<Expense>>(expenses => createdRange = expenses)
            .ReturnsAsync((List<Expense> expenses) => expenses);
        var items = new List<CreateExpenseData>
        {
            NewExpenseData("Rent"),
            NewExpenseData("Utilities"),
        };

        var expenses = await _service.CreateExpensesAsync(OrganizationId, items);

        Assert.NotNull(createdRange);
        Assert.Equal(2, createdRange!.Count);
        Assert.All(expenses, expense => Assert.Equal("Test User", expense.CreatedByUser.FullName));
        Assert.All(expenses, expense => Assert.Equal(OrganizationId, expense.OrganizationId));
    }

    [Fact]
    public async Task CreateExpensesAsync_WhenBatchWouldExceedMonthlyLimit_ThrowsPlanLimitExceededException()
    {
        SetupOrganization(PlanTier.Free);
        SetupMonthlyCount(19);
        var items = new List<CreateExpenseData> { NewExpenseData(), NewExpenseData() };

        var exception = await Assert.ThrowsAsync<PlanLimitExceededException>(
            () => _service.CreateExpensesAsync(OrganizationId, items));

        Assert.Contains("would exceed", exception.Message);
    }

    [Fact]
    public async Task CreateExpensesAsync_WhenOrganizationMissing_ThrowsKeyNotFoundException()
    {
        _organizationsRepository
            .Setup(repository => repository.GetByIdAsync(OrganizationId))
            .ReturnsAsync((Organization?)null);

        await Assert.ThrowsAsync<KeyNotFoundException>(
            () => _service.CreateExpensesAsync(OrganizationId, [NewExpenseData()]));
    }

    private void SetupOrganization(PlanTier planTier)
    {
        _organizationsRepository
            .Setup(repository => repository.GetByIdAsync(OrganizationId))
            .ReturnsAsync(new Organization { Id = OrganizationId, PlanTier = planTier });
    }

    private void SetupMonthlyCount(int count)
    {
        _expensesRepository
            .Setup(repository => repository.GetMonthlyCountByOrganizationAsync(
                OrganizationId, It.IsAny<DateTime>(), It.IsAny<DateTime>()))
            .ReturnsAsync(count);
    }

    private void SetupUser(string userId)
    {
        _usersRepository
            .Setup(repository => repository.GetByIdAsync(userId))
            .ReturnsAsync(new User { Id = userId, FirstName = "Test", LastName = "User" });
    }

    private static CreateExpenseData NewExpenseData(string description = "Groceries")
    {
        return new CreateExpenseData(
            description,
            ExpenseCategory.Food,
            120.50m,
            ExpenseStatus.Paid,
            PaymentMethod.Pix,
            DateTime.UtcNow,
            UserId,
            "   ");
    }
}
