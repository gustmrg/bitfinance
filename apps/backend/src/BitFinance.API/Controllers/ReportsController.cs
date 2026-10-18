using Asp.Versioning;
using BitFinance.API.Attributes;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[OrganizationAuthorization]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organizations/{organizationId:guid}/reports")]
public class ReportsController : ControllerBase
{
    private readonly IReportsService _reportsService;
    private readonly IOrganizationsRepository _organizationsRepository;

    public ReportsController(IReportsService reportsService, IOrganizationsRepository organizationsRepository)
    {
        _reportsService = reportsService;
        _organizationsRepository = organizationsRepository;
    }

    [HttpGet]
    [EndpointSummary("Get spending report")]
    [EndpointDescription("Returns monthly totals and category breakdowns of expenses and bills for the last N months, including the current one.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReportResponse>> GetReport(
        [FromRoute] Guid organizationId,
        [FromQuery] int months = 6)
    {
        if (months is < 1 or > 24)
        {
            return BadRequest("The months parameter must be between 1 and 24.");
        }

        var organization = await _organizationsRepository.GetByIdAsync(organizationId);
        if (organization is null)
        {
            return NotFound();
        }

        return Ok(await _reportsService.GetReportAsync(organization, months));
    }
}
