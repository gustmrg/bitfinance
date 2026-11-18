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
using BitFinance.Business.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace BitFinance.API.Controllers;

[ApiController]
[Authorize]
[OrganizationAuthorization]
[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/organizations/{organizationId:guid}/bills")]
public class BillsController : ControllerBase
{
    private const int MaxPageSize = 200;

    private readonly IBillsService _billsService;
    private readonly IAttachmentService _attachmentService;

    public BillsController(IBillsService billsService, IAttachmentService attachmentService)
    {
        _billsService = billsService;
        _attachmentService = attachmentService;
    }

    [HttpPost]
    [EndpointSummary("Create a bill")]
    [EndpointDescription("Creates a new bill within the specified organization.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<CreateBillResponse>> CreateBillAsync([FromRoute] Guid organizationId, [FromBody] CreateBillRequest request)
    {
        if (!ModelState.IsValid)
        {
            return UnprocessableEntity();
        }

        var isValidCategory = Enum.TryParse(request.Category, true, out BillCategory category);
        var isValidStatus = Enum.TryParse(request.Status, true, out BillStatus status);

        if (!isValidCategory || !isValidStatus) return UnprocessableEntity();

        if (request.Notes?.Length > 2000)
            return UnprocessableEntity("Notes must be 2000 characters or fewer.");

        if (request.Installments is { } installments && installments < 1)
            return UnprocessableEntity("Installments must be a positive integer.");

        if (request.Installments.HasValue && !request.Frequency.HasValue)
            return UnprocessableEntity("Installments require a frequency.");

        var result = await _billsService.CreateAsync(organizationId, new CreateBillData(
            request.Description, category, status, request.DueDate, request.PaymentDate,
            request.AmountDue, request.AmountPaid, request.Frequency, request.Installments, request.Notes));

        if (!result.IsSuccess)
            return ToActionResult(result.Error);

        var bill = result.Value;
        return CreatedAtAction(nameof(GetBillById), new
        {
            billId = bill.Id, organizationId = bill.OrganizationId
        }, MapCreateBillResponse(bill));
    }

    [HttpGet]
    [EndpointSummary("List bills")]
    [EndpointDescription("Returns a paginated list of bills for the organization. Supports optional filtering by date range, status (comma-separated), description (case-insensitive search), and type (oneTime, recurring or installment). The summary totals cover every matching bill, not only the returned page. Page size is capped at 200.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BillPageResponse>> GetBillsAsync(
        [FromRoute] Guid organizationId,
        [FromQuery] int page = 1, [FromQuery] int pageSize = 100,
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null,
        [FromQuery] string? status = null, [FromQuery] string? description = null,
        [FromQuery] string? type = null)
    {
        if (page < 1 || pageSize < 1)
            return BadRequest("Page and pageSize must be positive integers.");

        pageSize = Math.Min(pageSize, MaxPageSize);

        BillTypeFilter? typeFilter = null;
        if (!string.IsNullOrWhiteSpace(type))
        {
            if (!Enum.TryParse<BillTypeFilter>(type.Trim(), ignoreCase: true, out var parsedType)
                || !Enum.IsDefined(parsedType))
                return BadRequest("Invalid bill type.");

            typeFilter = parsedType;
        }

        List<BillStatus>? statuses = null;
        if (!string.IsNullOrWhiteSpace(status))
        {
            statuses = status.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Select(s => Enum.TryParse<BillStatus>(s, ignoreCase: true, out var parsed) ? (BillStatus?)parsed : null)
                .Where(s => s.HasValue)
                .Select(s => s!.Value)
                .ToList();

            if (statuses.Count == 0) statuses = null;
        }

        var result = await _billsService.GetPageAsync(organizationId,
            new BillListQuery(page, pageSize, from, to, statuses, description, typeFilter));

        if (!result.IsSuccess)
            return ToActionResult(result.Error);

        var (bills, totalRecords, summary) = result.Value;
        var totalPages = (int)Math.Ceiling((double)totalRecords / pageSize);

        return Ok(new BillPageResponse(
            bills.Select(MapGetBillResponse).ToList(), page, pageSize, totalRecords, totalPages,
            new BillSummaryResponse(summary.ToPay, summary.Overdue, summary.NextSevenDays, summary.Paid)));
    }

    [HttpGet]
    [Route("{billId:guid}")]
    [EndpointSummary("Get bill details")]
    [EndpointDescription("Returns the details and attached documents of a specific bill.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<GetBillResponse>> GetBillById([FromRoute] Guid organizationId, [FromRoute] Guid billId)
    {
        var result = await _billsService.GetByIdAsync(organizationId, billId);

        if (!result.IsSuccess)
            return ToActionResult(result.Error);

        return Ok(MapGetBillResponse(result.Value));
    }

    [HttpPatch]
    [Route("{billId:guid}")]
    [EndpointSummary("Update a bill")]
    [EndpointDescription("Updates the details of an existing bill.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<UpdateBillResponse>> UpdateBill([FromRoute] Guid organizationId, Guid billId, [FromBody] UpdateBillRequest request)
    {
        bool isValidCategory = Enum.TryParse(request.Category, true, out BillCategory category);
        bool isValidStatus = Enum.TryParse(request.Status, true, out BillStatus status);

        if (!isValidCategory || !isValidStatus) return UnprocessableEntity();

        if (request.Notes?.Length > 2000)
            return UnprocessableEntity("Notes must be 2000 characters or fewer.");

        var result = await _billsService.UpdateAsync(organizationId, billId, new UpdateBillData(
            request.Description, category, status, request.DueDate, request.PaymentDate,
            request.AmountDue, request.AmountPaid, request.Notes));

        if (!result.IsSuccess)
            return ToActionResult(result.Error);

        var bill = result.Value;
        return Ok(new UpdateBillResponse
        {
            Id = bill.Id,
            Description = bill.Description,
            Notes = bill.Notes,
            Category = bill.Category,
            Status = bill.Status,
            DueDate = new DateTime(bill.DueDate, TimeOnly.MinValue),
            PaidDate = bill.PaymentDate,
            AmountDue = bill.AmountDue,
            AmountPaid = bill.AmountPaid,
            BillSeriesId = bill.BillSeriesId,
            OccurrenceNumber = bill.OccurrenceNumber,
            TotalOccurrences = bill.TotalOccurrences,
            BillSeriesType = GetBillSeriesType(bill),
            BillSeriesIsActive = bill.BillSeries?.IsActive ?? false
        });
    }

    [HttpDelete]
    [Route("{billId:guid}")]
    [EndpointSummary("Delete a bill")]
    [EndpointDescription("Deletes a bill and its associated documents.")]
    public async Task<ActionResult> DeleteBillById([FromRoute] Guid organizationId, Guid billId)
    {
        var result = await _billsService.DeleteAsync(organizationId, billId);

        return result.IsSuccess ? NoContent() : ToActionResult(result.Error);
    }

    [HttpPost]
    [Route("{billId:guid}/documents")]
    [EndpointSummary("Upload a bill document")]
    [EndpointDescription("Uploads a file attachment to an existing bill.")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<UploadDocumentResponse>> UploadDocumentAsync(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid billId,
        [FromForm] UploadBillDocumentRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetCurrentUserId();

            if (userId is null)
                return Unauthorized("User is not authenticated.");

            using var stream = request.File.OpenReadStream();
            var attachment = await _attachmentService.UploadBillAttachmentAsync(
                organizationId,
                billId,
                stream,
                request.File.FileName,
                request.File.ContentType,
                request.FileCategory,
                userId
            );

            var response = new UploadDocumentResponse
            {
                Id = attachment.Id,
                FileName = attachment.OriginalFileName,
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
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (RequestValidationException e)
        {
            return BadRequest(new { error = e.Message });
        }
    }

    [HttpGet("{billId:guid}/documents/{documentId}")]
    [EndpointSummary("Download a bill document")]
    [EndpointDescription("Downloads a specific document attached to a bill.")]
    public async Task<IActionResult> GetDocument([FromRoute] Guid organizationId, Guid billId, Guid documentId)
    {
        var bill = await _billsService.GetByIdAsync(organizationId, billId);
        if (!bill.IsSuccess)
            return ToActionResult(bill.Error);

        try
        {
            var (stream, fileName, contentType) = await _attachmentService.GetDocumentAsync(
                organizationId,
                billId,
                documentId,
                AttachmentType.BillDocument);
            return File(stream, contentType, fileName);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("{billId:guid}/documents/{documentId:guid}/download-url")]
    [EndpointSummary("Get bill document download URL")]
    [EndpointDescription("Returns a temporary signed URL for downloading a specific document attached to a bill.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DownloadDocumentUrlResponse>> GetDocumentDownloadUrl(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid billId,
        [FromRoute] Guid documentId)
    {
        try
        {
            var result = await _attachmentService.GetDocumentDownloadUrlAsync(
                organizationId,
                billId,
                documentId,
                AttachmentType.BillDocument);

            return Ok(new DownloadDocumentUrlResponse(
                result.Url,
                result.FileName,
                result.ContentType,
                result.ExpiresAt));
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{billId:guid}/documents/{documentId:guid}")]
    [EndpointSummary("Delete a bill document")]
    [EndpointDescription("Deletes a specific document attached to a bill.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteDocument(
        [FromRoute] Guid organizationId,
        [FromRoute] Guid billId,
        [FromRoute] Guid documentId)
    {
        try
        {
            var result = await _attachmentService.DeleteDocumentAsync(
                organizationId,
                billId,
                documentId,
                AttachmentType.BillDocument);

            if (!result)
                return NotFound();

            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpGet("series")]
    [EndpointSummary("List bill series")]
    [EndpointDescription("Returns the recurring and installment bill series of the organization, with the next open occurrence of each one.")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<ActionResult<List<BillSeriesResponse>>> GetBillSeriesAsync([FromRoute] Guid organizationId)
    {
        var series = await _billsService.GetSeriesAsync(organizationId);

        return Ok(series.Select(item =>
        {
            var nextBill = item.Bills.FirstOrDefault();
            return new BillSeriesResponse(
                item.Id,
                item.Description,
                item.Category,
                item.Frequency,
                item.Type,
                item.AmountDue,
                item.StartDate,
                item.TotalOccurrences,
                item.NextOccurrenceNumber - 1,
                item.IsActive,
                item.StoppedAt,
                nextBill?.Id,
                nextBill?.DueDate);
        }).ToList());
    }

    [HttpPost]
    [Route("series/{seriesId:guid}/stop")]
    [EndpointSummary("Stop future bill generation for a series")]
    [EndpointDescription("Stops a recurring or installment bill series from generating any future occurrences and deletes its unpaid occurrences due after today, along with their documents. Past, current, and paid occurrences are preserved.")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult> StopBillSeriesAsync([FromRoute] Guid organizationId, [FromRoute] Guid seriesId)
    {
        var result = await _billsService.StopSeriesAsync(organizationId, seriesId);

        return result.IsSuccess ? NoContent() : ToActionResult(result.Error);
    }

    private ActionResult ToActionResult(Error error)
    {
        return error.Type switch
        {
            ErrorType.PlanLimitExceeded => StatusCode(StatusCodes.Status403Forbidden, new { error = error.Message }),
            _ => NotFound()
        };
    }

    private string? GetCurrentUserId()
    {
        return User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value;
    }

    private static BillSeriesType? GetBillSeriesType(Bill bill)
    {
        if (bill.BillSeriesId is null)
            return null;

        return bill.TotalOccurrences is null ? BillSeriesType.Recurring : BillSeriesType.Installment;
    }

    private static CreateBillResponse MapCreateBillResponse(Bill bill)
    {
        return new CreateBillResponse
        {
            Id = bill.Id,
            Description = bill.Description,
            Notes = bill.Notes,
            Category = bill.Category,
            Status = bill.Status,
            CreatedDate = bill.CreatedAt,
            DueDate = new DateTime(bill.DueDate, TimeOnly.MinValue),
            PaidDate = bill.PaymentDate,
            AmountDue = bill.AmountDue,
            AmountPaid = bill.AmountPaid,
            BillSeriesId = bill.BillSeriesId,
            OccurrenceNumber = bill.OccurrenceNumber,
            TotalOccurrences = bill.TotalOccurrences,
            BillSeriesType = GetBillSeriesType(bill)
        };
    }

    private static GetBillResponse MapGetBillResponse(Bill bill)
    {
        return new GetBillResponse
        {
            Id = bill.Id,
            Description = bill.Description,
            Notes = bill.Notes,
            Category = bill.Category,
            Status = bill.Status,
            CreatedAt = bill.CreatedAt,
            DueDate = new DateTime(bill.DueDate, TimeOnly.MinValue),
            PaymentDate = bill.PaymentDate,
            AmountDue = bill.AmountDue,
            AmountPaid = bill.AmountPaid,
            Attachments = bill.Attachments.Select(a => new AttachmentResponseModel
            {
                Id = a.Id,
                FileName = a.OriginalFileName,
                ContentType = a.ContentType,
                FileCategory = a.FileCategory,
                AttachmentType = a.AttachmentType
            }).ToList(),
            BillSeriesId = bill.BillSeriesId,
            OccurrenceNumber = bill.OccurrenceNumber,
            TotalOccurrences = bill.TotalOccurrences,
            BillSeriesType = GetBillSeriesType(bill),
            BillSeriesFrequency = bill.BillSeries?.Frequency,
            BillSeriesIsActive = bill.BillSeries?.IsActive ?? false
        };
    }
}
