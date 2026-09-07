using Asp.Versioning;
using BitFinance.API.Attributes;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[OrganizationAuthorization]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organizations/{organizationId:guid}/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IBillsService _billsService;
    private readonly IExpensesService _expensesService;
    private readonly IOrganizationsRepository _organizationsRepository;

    public DashboardController(
        IBillsService billsService,
        IExpensesService expensesService,
        IOrganizationsRepository organizationsRepository)
    {
        _billsService = billsService;
        _expensesService = expensesService;
        _organizationsRepository = organizationsRepository;
    }

    [HttpGet("summary")]
    [EndpointSummary("Get dashboard summary")]
    [EndpointDescription("Returns aggregate dashboard metrics for the selected organization and period.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(
        [FromRoute] Guid organizationId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        if (IsInvalidDateRange(from, to))
        {
            return BadRequest("The from date must be earlier than or equal to the to date.");
        }

        var organization = await _organizationsRepository.GetByIdAsync(organizationId);
        var (effectiveFrom, effectiveTo) = GetEffectiveDateRange(organization, from, to);
        var monthlyBudget = organization?.Budget?.Amount;
        var spentThisMonth = await _expensesService.GetTotalAmountAsync(organizationId, effectiveFrom, effectiveTo);
        var upcomingBillsSummary = await _billsService.GetUpcomingBillsSummaryAsync(
            organizationId,
            GetLocalDate(organization, effectiveFrom),
            GetLocalDate(organization, effectiveTo));
        var remainingBudget = monthlyBudget.HasValue
            ? Math.Max(monthlyBudget.Value - spentThisMonth, 0M)
            : (decimal?)null;
        var spentPercentage = monthlyBudget.HasValue
            ? monthlyBudget.Value > 0
                ? (int)Math.Round(spentThisMonth / monthlyBudget.Value * 100M, MidpointRounding.AwayFromZero)
                : 0
            : (int?)null;

        var response = new DashboardSummaryResponse(
            monthlyBudget,
            spentThisMonth,
            remainingBudget,
            spentPercentage,
            upcomingBillsSummary.TotalAmount,
            upcomingBillsSummary.Count);

        return Ok(response);
    }

    [HttpGet("upcoming-bills")]
    [EndpointSummary("Get upcoming bills")]
    [EndpointDescription("Returns a list of upcoming bills for the organization dashboard.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UpcomingBillsResponse>> GetUpcomingBills(
        [FromRoute] Guid organizationId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        if (IsInvalidDateRange(from, to))
        {
            return BadRequest("The from date must be earlier than or equal to the to date.");
        }

        var organization = await _organizationsRepository.GetByIdAsync(organizationId);
        var (effectiveFrom, effectiveTo) = GetEffectiveDateRange(organization, from, to);
        var bills = await _billsService.GetUpcomingBills(
            organizationId,
            GetLocalDate(organization, effectiveFrom),
            GetLocalDate(organization, effectiveTo));

        var models = bills.Select(x => new DashboardBillResponse
        {
            Id = x.Id,
            Description = x.Description,
            Category = x.Category,
            Status = x.Status,
            AmountDue = x.AmountDue,
            CreatedAt = x.CreatedAt,
            DueDate = x.DueDate,
        }).ToList();

        var response = new UpcomingBillsResponse(models);

        return Ok(response);
    }

    [HttpGet("recent-expenses")]
    [EndpointSummary("Get recent expenses")]
    [EndpointDescription("Returns a list of recent expenses for the organization dashboard.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RecentExpensesResponse>> GetRecentExpenses(
        [FromRoute] Guid organizationId,
        [FromQuery] DateTime? from = null,
        [FromQuery] DateTime? to = null)
    {
        if (IsInvalidDateRange(from, to))
        {
            return BadRequest("The from date must be earlier than or equal to the to date.");
        }

        var (effectiveFrom, effectiveTo) = await GetEffectiveDateRangeAsync(organizationId, from, to);
        var expenses = await _expensesService.GetRecentExpenses(organizationId, effectiveFrom, effectiveTo);

        var models = expenses.Select(x => new DashboardExpenseResponse
        {
            Id = x.Id,
            Description = x.Description,
            Category = x.Category,
            Amount = x.Amount,
            Date = x.OccurredAt,
        }).ToList();

        var response = new RecentExpensesResponse(models);

        return Ok(response);
    }

    private async Task<(DateTime? From, DateTime? To)> GetEffectiveDateRangeAsync(
        Guid organizationId,
        DateTime? from,
        DateTime? to)
    {
        if (from.HasValue || to.HasValue)
        {
            return (from, to);
        }

        var organization = await _organizationsRepository.GetByIdAsync(organizationId);
        return GetEffectiveDateRange(organization, from, to);
    }

    private static (DateTime? From, DateTime? To) GetEffectiveDateRange(
        Organization? organization,
        DateTime? from,
        DateTime? to)
    {
        if (from.HasValue || to.HasValue)
        {
            return (from, to);
        }

        var localNow = organization?.GetCurrentLocalTime() ?? DateTime.UtcNow;
        var monthStart = new DateTime(localNow.Year, localNow.Month, 1, 0, 0, 0, localNow.Kind);
        var monthEnd = monthStart.AddMonths(1).AddTicks(-1);

        return (monthStart, monthEnd);
    }

    private static bool IsInvalidDateRange(DateTime? from, DateTime? to)
    {
        return from.HasValue && to.HasValue && from.Value > to.Value;
    }

    private static DateOnly? GetLocalDate(Organization? organization, DateTime? dateTime)
    {
        if (!dateTime.HasValue)
            return null;

        return organization?.GetLocalDate(dateTime.Value) ?? DateOnly.FromDateTime(dateTime.Value);
    }
}
