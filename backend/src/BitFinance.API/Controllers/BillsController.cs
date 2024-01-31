using System.Globalization;
using System.Text.Json;
using BitFinance.API.Caching;
using BitFinance.API.Models;
using BitFinance.Business.Entities;
using BitFinance.Data.Contexts;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BitFinance.API.Controllers;

[ApiController]
[Route("bills")]
[Authorize]
public class BillsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BillsController> _logger;
    private readonly ICacheService _cache;
    
    public BillsController(ApplicationDbContext context, ILogger<BillsController> logger, ICacheService cache)
    {
        _context = context;
        _logger = logger;
        _cache = cache;
    }

    [HttpGet]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<List<GetBillResponse>>> GetBillsAsync()
    {
        try
        {
            string key = _cache.GenerateKey<Bill>(string.Empty);
            IEnumerable<Bill>? bills = await _cache.GetAsync<List<Bill>>(key);

            if (bills is null)
            {
                bills = await _context.Bills.AsNoTracking().ToListAsync();
            }
            
            await _cache.SetAsync(key, bills);
            
            List<GetBillResponse> response = bills.Select(bill => new GetBillResponse
                {
                    Id = bill.Id,
                    Name = bill.Name,
                    Category = bill.Category,
                    CreatedDate = bill.CreatedDate,
                    DueDate = bill.DueDate,
                    PaidDate = bill.PaidDate,
                    AmountDue = bill.AmountDue,
                    AmountPaid = bill.AmountPaid
                })
                .ToList();
            
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("{Time} - Error on {MethodName} method request: {Message}", 
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture), nameof(GetBillsAsync), ex.Message);
            return BadRequest();
        }
    }
    
    [HttpGet]
    [Route("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<GetBillResponse>> GetBillById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        try
        {
            Bill? bill;
            string key = _cache.GenerateKey<Bill>(id.ToString());
            
            bill = await _cache.GetAsync<Bill>(key, cancellationToken);

            if (bill is null)
            {
                bill = await _context.Bills.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);   
                
                if (bill is null)
                {
                    return NotFound();
                }
            }
            
            await _cache.SetAsync(key, bill, cancellationToken);
            
            var response = new GetBillResponse
            {
                Id = bill.Id,
                Name = bill.Name,
                Category = bill.Category,
                CreatedDate = bill.CreatedDate,
                DueDate = bill.DueDate,
                PaidDate = bill.PaidDate,
                AmountDue = bill.AmountDue,
                AmountPaid = bill.AmountPaid
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("{Time} - Error on {MethodName} method request: {Message}", 
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture), nameof(GetBillById), ex.Message);
            return BadRequest();
        }
    }

    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<CreateBillResponse>> CreateBillAsync([FromBody] CreateBillRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            if (!ModelState.IsValid)
                return UnprocessableEntity();

            var bill = new Bill
            {
                Name = request.Name,
                Category = request.Category,
                CreatedDate = DateTime.UtcNow.AddHours(-3),
                DueDate = request.DueDate.ToUniversalTime(),
                PaidDate = request.PaidDate?.ToUniversalTime(),
                AmountDue = request.AmountDue,
                AmountPaid = request.AmountPaid,
                IsPaid = request.AmountPaid is not null,
                IsDeleted = false
            };

            _context.Bills.Add(bill);
            await _context.SaveChangesAsync(cancellationToken);
            
            string key = _cache.GenerateKey<Bill>(bill.Id.ToString());
            await _cache.SetAsync(key, bill, cancellationToken);

            var response = new CreateBillResponse { Id = bill.Id };
            
            return CreatedAtAction(nameof(GetBillById), new { id = bill.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("{Time} - Error on {MethodName} method request: {Message}", 
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture), nameof(CreateBillAsync), ex.Message);
            return BadRequest();
        }
    }
    
    [HttpPut]
    [Route("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<ActionResult<UpdateBillResponse>> UpdateBillById(Guid id, [FromBody] UpdateBillRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            Bill? bill;
            
            bill = await _context.Bills.FirstOrDefaultAsync(b => b.Id == id, cancellationToken);

            if (bill is null)
                return NotFound($"Could not find the requested Bill for id {id}");

            bill.Name = request.Name;
            bill.Category = request.Category;
            bill.DueDate = request.DueDate.ToUniversalTime();
            bill.PaidDate = request.PaidDate?.ToUniversalTime();
            bill.AmountDue = request.AmountDue;
            bill.AmountPaid = request.AmountPaid;
            bill.IsPaid = request.AmountPaid is not null;

            _context.Bills.Update(bill);
            await _context.SaveChangesAsync(cancellationToken);
            
            string key = _cache.GenerateKey<Bill>(bill.Id.ToString());
            await _cache.RemoveAsync(key, cancellationToken);
            await _cache.SetAsync(key, bill, cancellationToken);

            var response = new UpdateBillResponse
            {
                Id = bill.Id,
                Name = bill.Name,
                Category = bill.Category,
                DueDate = bill.DueDate,
                PaidDate = bill.PaidDate,
                AmountDue = bill.AmountDue,
                AmountPaid = bill.AmountPaid,
                IsPaid = bill.IsPaid
            };
        
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("{Time} - Error on {MethodName} method request: {Message}", 
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture), nameof(UpdateBillById), 
                ex.Message);
            return BadRequest();
        }
    }
    
    [HttpDelete]
    [Route("{id:guid}")]
    public async Task<ActionResult<DeleteBillResponse>> DeleteBillById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var bill = await _context.Bills.FirstOrDefaultAsync(x => x.Id == id && x.DeletedDate == null, cancellationToken);

            if (bill is null)
            {
                return NotFound("Could not find the requested Bill");
            }
            
            bill.DeletedDate = DateTime.UtcNow.AddHours(-3);
            bill.IsDeleted = true;
            _context.Bills.Update(bill);
            await _context.SaveChangesAsync(cancellationToken);
            
            string key = _cache.GenerateKey<Bill>(bill.Id.ToString());
            await _cache.RemoveAsync(key, cancellationToken);

            var response = new DeleteBillResponse
            {
                Id = bill.Id,
                IsDeleted = bill.IsDeleted
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogInformation("{Time} - Error on {MethodName} method request: {Message}", 
                DateTime.Now.ToString("s", CultureInfo.InvariantCulture), nameof(DeleteBillById), 
                ex.Message);
            return BadRequest();
        }
    }
}