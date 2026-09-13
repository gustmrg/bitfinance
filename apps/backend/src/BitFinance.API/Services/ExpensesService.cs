using BitFinance.API.Models;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;

namespace BitFinance.API.Services;

public class ExpensesService : IExpensesService
{
    private readonly IExpensesRepository _expensesRepository;
    private readonly IOrganizationsRepository _organizationsRepository;
    private readonly IUsersRepository _usersRepository;

    public ExpensesService(
        IExpensesRepository expensesRepository,
        IOrganizationsRepository organizationsRepository,
        IUsersRepository usersRepository)
    {
        _expensesRepository = expensesRepository;
        _organizationsRepository = organizationsRepository;
        _usersRepository = usersRepository;
    }

    public async Task<List<Expense>> GetRecentExpenses(Guid organizationId, DateTime? from = null, DateTime? to = null)
    {
        return await _expensesRepository.GetRecentExpenses(organizationId, from, to);
    }

    public async Task<decimal> GetTotalAmountAsync(Guid organizationId, DateTime? from = null, DateTime? to = null)
    {
        return await _expensesRepository.GetTotalAmountAsync(organizationId, from, to);
    }

    public async Task<Expense> CreateExpenseAsync(Guid organizationId, CreateExpenseData data)
    {
        var organization = await GetOrganizationOrThrowAsync(organizationId);
        await EnsureWithinMonthlyLimitAsync(organization, 1);

        var expense = BuildExpense(organizationId, data);
        await _expensesRepository.CreateAsync(expense);
        await PopulateCreatedByUsersAsync([expense]);

        return expense;
    }

    public async Task<List<Expense>> CreateExpensesAsync(Guid organizationId, IReadOnlyList<CreateExpenseData> items)
    {
        var organization = await GetOrganizationOrThrowAsync(organizationId);
        await EnsureWithinMonthlyLimitAsync(organization, items.Count);

        var expenses = items.Select(item => BuildExpense(organizationId, item)).ToList();
        await _expensesRepository.CreateRangeAsync(expenses);
        await PopulateCreatedByUsersAsync(expenses);

        return expenses;
    }

    private async Task<Organization> GetOrganizationOrThrowAsync(Guid organizationId)
    {
        return await _organizationsRepository.GetByIdAsync(organizationId)
               ?? throw new KeyNotFoundException($"Organization {organizationId} not found.");
    }

    private async Task EnsureWithinMonthlyLimitAsync(Organization organization, int expenseCount)
    {
        var entitlement = PlanEntitlement.For(organization.EffectivePlanTier);
        var (monthStartUtc, monthEndUtc) = organization.GetCurrentMonthBoundariesUtc();
        var currentExpenseCount = await _expensesRepository.GetMonthlyCountByOrganizationAsync(
            organization.Id, monthStartUtc, monthEndUtc);

        if (currentExpenseCount + expenseCount <= entitlement.MaxExpensesPerMonth)
            return;

        var message = expenseCount == 1
            ? $"Monthly expense limit of {entitlement.MaxExpensesPerMonth} reached."
            : $"Creating {expenseCount} expenses would exceed the monthly limit of {entitlement.MaxExpensesPerMonth} ({currentExpenseCount} already created this month).";
        throw new PlanLimitExceededException(message);
    }

    private async Task PopulateCreatedByUsersAsync(List<Expense> expenses)
    {
        foreach (var userId in expenses.Select(expense => expense.CreatedByUserId).Distinct())
        {
            var user = await _usersRepository.GetByIdAsync(userId)
                       ?? throw new KeyNotFoundException($"User {userId} not found.");

            foreach (var expense in expenses.Where(expense => expense.CreatedByUserId == userId))
            {
                expense.CreatedByUser = user;
            }
        }
    }

    private static Expense BuildExpense(Guid organizationId, CreateExpenseData data)
    {
        return new Expense
        {
            Description = data.Description,
            Notes = NormalizeNotes(data.Notes),
            PaymentMethod = data.PaymentMethod,
            Category = data.Category,
            Amount = data.Amount,
            Status = data.Status,
            OccurredAt = data.OccurredAt,
            CreatedAt = DateTime.UtcNow,
            CreatedByUserId = data.CreatedByUserId,
            OrganizationId = organizationId,
        };
    }

    private static string? NormalizeNotes(string? notes)
    {
        return string.IsNullOrWhiteSpace(notes) ? null : notes.Trim();
    }
}
