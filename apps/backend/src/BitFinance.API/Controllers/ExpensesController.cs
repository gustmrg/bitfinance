using System.Globalization;
using System.Security.Claims;
using Asp.Versioning;
using BitFinance.API.Attributes;
using BitFinance.API.Models;
using BitFinance.API.Models.Request;
using BitFinance.API.Models.Response;
using BitFinance.API.Services.Interfaces;
using BitFinance.Business.Entities;
using BitFinance.Business.Enums;
using BitFinance.Business.Exceptions;
using BitFinance.Data.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[OrganizationAuthorization]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organizations/{organizationId:guid}/expenses")]
public class ExpensesController : ControllerBase
{
    private readonly ILogger<ExpensesController> _logger;
    private readonly IExpensesRepository _expensesRepository;
    private readonly IOrganizationsRepository _organizationsRepository;
    private readonly IAttachmentService _attachmentService;

    public ExpensesController(
        ILogger<ExpensesController> logger,
        IExpensesRepository expensesRepository,
        IOrganizationsRepository organizationsRepository,
        IAttachmentService attachmentService)
    {
        _logger = logger;
        _expensesRepository = expensesRepository;
        _organizationsRepository = organizationsRepository;
        _attachmentService = attachmentService;
    }

    [HttpGet]
    [EndpointSummary("List expenses")]
    [EndpointDescription("Returns a paginated list of expenses for the organization. Supports optional date range filtering.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<PagedResponse<GetExpenseResponse>>> GetExpenses(
        [FromRoute] Guid organizationId,
        [FromQuery] int page = 1, int pageSize = 100, DateTime? from = null, DateTime? to = null)
    {
        var totalRecords = await _expensesRepository.GetEntriesCountAsync();
        var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);
        var expenses = await _expensesRepository.GetAllByOrganizationAsync(organizationId, page, pageSize, from, to);
        var expensesDto = expenses.Select(expense => new GetExpenseResponse
        {
            Id = expense.Id,
            Amount = expense.Amount,
            Category = expense.Category,
            Description = expense.Description,
            Status = expense.Status,
            OccurredAt = expense.OccurredAt,
            CreatedBy = expense.CreatedByUser.FullName,
            Attachments = expense.Attachments.Select(a => new AttachmentResponseModel
            {
                Id = a.Id,
                FileName = a.FileName,
                ContentType = a.ContentType,
                FileCategory = a.FileCategory,
                AttachmentType = a.AttachmentType
            }).ToList()
        }).ToList();

        return Ok(new PagedResponse<GetExpenseResponse>(expensesDto, page, pageSize, totalRecords, totalPages));
    }

    [HttpGet]
    [Route("{expenseId:guid}")]
    [EndpointSummary("Get expense details")]
    [EndpointDescription("Returns the details of a specific expense.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<GetExpenseResponse>> GetExpenseById([FromRoute] Guid organizationId, [FromRoute] Guid expenseId)
    {
        try
        {
            var expense = await _expensesRepository.GetByIdAsync(expenseId);

            if (expense is null)
            {
                return NotFound();
            }

            var response = new GetExpenseResponse
            {
                Id = expense.Id,
                Amount = expense.Amount,
                Category = expense.Category,
                Description = expense.Description,
                Status = expense.Status,
                OccurredAt = expense.OccurredAt,
                CreatedBy = expense.CreatedByUser.FullName,
                Attachments = expense.Attachments.Select(a => new AttachmentResponseModel
                {
                    Id = a.Id,
                    FileName = a.FileName,
                    ContentType = a.ContentType,
                    FileCategory = a.FileCategory,
                    AttachmentType = a.AttachmentType
                }).ToList()
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            Log.Error("{Timestamp} - Error on {MethodName} method request: {Message}",
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture),
                nameof(GetExpenseById),
                ex.Message);
            return BadRequest();
        }
    }

    [HttpPost]
    [EndpointSummary("Create an expense")]
    [EndpointDescription("Creates a new expense within the specified organization.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<CreateExpenseResponse>> CreateExpenseAsync(
        [FromRoute] Guid organizationId,
        [FromBody] CreateExpenseRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return UnprocessableEntity();
            }

            var isValidCategory = Enum.TryParse(request.Category, true, out ExpenseCategory category);
            if (!isValidCategory) return UnprocessableEntity();

            var isValidStatus = Enum.TryParse(request.Status, true, out ExpenseStatus status);
            if (!isValidStatus) return UnprocessableEntity();

            var organization = await _organizationsRepository.GetByIdAsync(organizationId);
            if (organization is null) return NotFound();

            var entitlement = PlanEntitlement.For(organization.EffectivePlanTier);
            var (monthStartUtc, monthEndUtc) = organization.GetCurrentMonthBoundariesUtc();
            var currentExpenseCount = await _expensesRepository.GetMonthlyCountByOrganizationAsync(
                organizationId, monthStartUtc, monthEndUtc);

            if (currentExpenseCount >= entitlement.MaxExpensesPerMonth)
                return StatusCode(403, new { error = $"Monthly expense limit of {entitlement.MaxExpensesPerMonth} reached." });

            Expense expense = new()
            {
                Description = request.Description,
                Category = category,
                Amount = request.Amount,
                Status = status,
                OccurredAt = request.OccurredAt ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow,
                CreatedByUserId = request.CreatedBy,
                OrganizationId = organizationId,
            };

            await _expensesRepository.CreateAsync(expense);

            var response = new CreateExpenseResponse
            {
                Id = expense.Id,
                Description = expense.Description,
                Category = expense.Category,
                Amount = expense.Amount,
                Status = expense.Status,
                OccurredAt = expense.OccurredAt,
                CreatedBy = expense.CreatedByUser.FullName,
            };

            return CreatedAtAction(nameof(GetExpenseById), new { expenseId = expense.Id, organizationId = expense.OrganizationId }, response);
        }
        catch (Exception ex)
        {
            Log.Error("{Timestamp} - Error on {MethodName} method request: {Message}",
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture),
                nameof(CreateExpenseAsync),
                ex.Message);
            return BadRequest();
        }
    }

    [HttpPatch]
    [Route("{expenseId:guid}")]
    [EndpointSummary("Update an expense")]
    [EndpointDescription("Updates the details of an existing expense.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<UpdateExpenseResponse>> UpdateExpense([FromRoute] Guid organizationId, [FromRoute] Guid expenseId, [FromBody] UpdateExpenseRequest request)
    {
        try
        {
            var isValidCategory = Enum.TryParse(request.Category, true, out ExpenseCategory category);
            if (!isValidCategory) return UnprocessableEntity();

            var isValidStatus = Enum.TryParse(request.Status, true, out ExpenseStatus status);
            if (!isValidStatus) return UnprocessableEntity();

            var expense = await _expensesRepository.GetByIdAsync(expenseId);

            if (expense is null) return NotFound();

            expense.Description = request.Description;
            expense.Category = category;
            expense.Amount = request.Amount;
            expense.Status = status;
            expense.OccurredAt = request.OccurredAt ?? DateTime.UtcNow;
            expense.UpdatedAt = DateTime.UtcNow;

            await _expensesRepository.UpdateAsync(expense);

            return Ok(new UpdateExpenseResponse(expense.Id, expense.Description, expense.Category, expense.Amount, expense.Status, expense.OccurredAt, expense.CreatedByUser.FullName));
        }
        catch (Exception ex)
        {
            Log.Error("{Timestamp} - Error on {MethodName} method request: {Message}",
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture),
                nameof(UpdateExpense),
                ex.Message);
            return BadRequest();
        }
    }

    [HttpDelete]
    [Route("{expenseId:guid}")]
    [EndpointSummary("Delete an expense")]
    [EndpointDescription("Deletes an expense and its associated documents.")]
    public async Task<ActionResult> DeleteExpenseById([FromRoute] Guid organizationId, Guid expenseId)
    {
        try
        {
            Expense? expense = await _expensesRepository.GetByIdAsync(expenseId);

            if (expense is null)
            {
                return NotFound();
            }

            foreach (var attachment in expense.Attachments)
            {
                await _attachmentService.DeleteAttachmentAsync(attachment.Id);
            }

            await _expensesRepository.DeleteAsync(expense);

            return NoContent();
        }
        catch (Exception ex)
        {
            Log.Error("{Timestamp} - Error on {MethodName} method request: {Message}",
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture),
                nameof(DeleteExpenseById),
                ex.Message);
            return BadRequest();
        }
    }

    [HttpPost]
    [Route("{expenseId:guid}/documents")]
    [EndpointSummary("Upload an expense document")]
    [EndpointDescription("Uploads a file attachment to an existing expense.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UploadDocumentResponse>> UploadDocumentAsync(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid expenseId,
        [FromForm] UploadExpenseDocumentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;

            if (userId is null)
                return Unauthorized("User is not authenticated.");

            using var stream = request.File.OpenReadStream();
            var attachment = await _attachmentService.UploadExpenseAttachmentAsync(
                organizationId,
                expenseId,
                stream,
                request.File.FileName,
                request.File.ContentType,
                request.FileCategory,
                userId
            );

            var response = new UploadDocumentResponse
            {
                Id = attachment.Id,
                FileName = attachment.FileName,
                ContentType = attachment.ContentType,
                FileCategory = attachment.FileCategory,
                AttachmentType = attachment.AttachmentType
            };

            return Ok(response);
        }
        catch (PlanLimitExceededException ex)
        {
            return StatusCode(403, new { error = ex.Message });
        }
        catch (Exception e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("{expenseId:guid}/documents/{attachmentId}")]
    [EndpointSummary("Download an expense document")]
    [EndpointDescription("Downloads a specific document attached to an expense.")]
    public async Task<IActionResult> GetDocument([FromRoute] Guid organizationId, Guid expenseId, Guid attachmentId)
    {
        var expense = await _expensesRepository.GetByIdAsync(expenseId);

        if (expense is null)
            return NotFound();

        var (stream, fileName, contentType) = await _attachmentService.GetAttachmentAsync(attachmentId);
        return File(stream, contentType, fileName);
    }

    [HttpDelete("{expenseId:guid}/documents/{attachmentId:guid}")]
    [EndpointSummary("Delete an expense document")]
    [EndpointDescription("Deletes a specific document attached to an expense.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid expenseId,
        [FromRoute] Guid attachmentId)
    {
        try
        {
            var expense = await _expensesRepository.GetByIdAsync(expenseId);

            if (expense is null)
                return NotFound();

            var result = await _attachmentService.DeleteAttachmentAsync(attachmentId);

            if (!result)
                return NotFound();

            return NoContent();
        }
        catch (Exception ex)
        {
            Log.Error("{Timestamp} - Error on {MethodName} method request: {Message}",
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture),
                nameof(DeleteDocument),
                ex.Message);
            return BadRequest();
        }
    }
}
