using System.Text.Json.Serialization;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Enums;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/organizations/{organizationId:guid}/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly IBillsService _billsService;
    private readonly IExpensesService _expensesService;

    public DashboardController(IBillsService billsService, IExpensesService expensesService)
    {
        _billsService = billsService;
        _expensesService = expensesService;
    }

    [HttpGet("upcoming-bills")]
    [EndpointSummary("Get upcoming bills")]
    [EndpointDescription("Returns a list of upcoming bills for the organization dashboard.")]
    public async Task<ActionResult> GetUpcomingBills([FromRoute] Guid organizationId)
    {
        var bills = await _billsService.GetUpcomingBills(organizationId);

        var models = bills.Select(x => new BillResponseModel
        {
            Id = x.Id,
            Description = x.Description,
            Category = x.Category,
            Status = x.Status,
            DueDate = new DateTimeOffset(x.DueDate, TimeOnly.MinValue, TimeSpan.Zero),
            AmountDue = x.AmountDue,
        }).ToList();

        var response = new UpcomingBillsResponse(models);
        
        return Ok(response);
    }
    
    [HttpGet("recent-expenses")]
    [EndpointSummary("Get recent expenses")]
    [EndpointDescription("Returns a list of recent expenses for the organization dashboard.")]
    public async Task<ActionResult> GetRecentExpenses([FromRoute] Guid organizationId)
    {
        var expenses = await _expensesService.GetRecentExpenses(organizationId);
        
        var models = expenses.Select(x => new ExpenseResponseModel
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
}

internal record UpcomingBillsResponse(List<BillResponseModel> Data);

internal record RecentExpensesResponse(List<ExpenseResponseModel> Data);

internal class BillResponseModel
{
    public Guid Id { get; set; }
    
    public string Description { get; set; } = null!;
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BillCategory Category { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public BillStatus Status { get; set; }
    
    public decimal AmountDue { get; set; }
    
    public DateTimeOffset DueDate { get; set; }
}

internal class ExpenseResponseModel
{
    public Guid Id { get; set; }
    
    public string Description { get; set; } = null!;
    
    public decimal Amount { get; set; }
    
    public DateTimeOffset Date { get; set; }
    
    [JsonConverter(typeof(JsonStringEnumConverter))]
    public ExpenseCategory Category { get; set; }
}