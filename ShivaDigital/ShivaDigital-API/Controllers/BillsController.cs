using Microsoft.AspNetCore.Mvc;
using ShivaDigital_API.Data;
using ShivaDigital_API.Models;

namespace ShivaDigital_API.Controllers;

[ApiController]
[Route("[controller]")]
public class BillsController : ControllerBase
{
    private readonly BillRepository _repository;

    public BillsController(BillRepository repository)
    {
        _repository = repository;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Bill>>> GetBills()
    {
        var bills = await _repository.GetAllAsync();
        return Ok(bills);
    }

    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Bill>>> SearchBills([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var effectiveFrom = fromDate ?? DateTime.Today.AddMonths(-1);
        var effectiveTo = toDate ?? DateTime.Today;
        var bills = await _repository.SearchAsync(effectiveFrom, effectiveTo);
        return Ok(bills);
    }

    [HttpGet("sheets/{sheetType}")]
    public async Task<ActionResult<IEnumerable<SheetOption>>> GetSheets(string sheetType)
    {
        var sheets = await _repository.GetSheetsAsync(sheetType);
        return Ok(sheets);
    }

    [HttpGet("filesizes")]
    public async Task<ActionResult<IEnumerable<FileSizeOption>>> GetFileSizes()
    {
        var fileSizes = await _repository.GetFileSizesAsync();
        return Ok(fileSizes);
    }

    [HttpPost]
    public async Task<ActionResult<Bill>> CreateBill(Bill bill)
    {
        var created = await _repository.CreateAsync(bill);
        return CreatedAtAction(nameof(GetBills), new { id = created.BillID ?? 0 }, created);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Bill>> GetBill(int id)
    {
        var bill = await _repository.GetByIdAsync(id);
        if (bill == null) return NotFound();
        return Ok(bill);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<Bill>> UpdateBill(int id, Bill bill)
    {
        if (bill == null || bill.BillID != id) return BadRequest();
        var updated = await _repository.UpdateAsync(bill);
        return Ok(updated);
    }

    [HttpPost("{id}/payments")]
    public async Task<ActionResult<Bill>> AddPayment(int id, PaymentRequest request)
    {
        if (request is null || request.AmountPaid <= 0)
        {
            return BadRequest();
        }

        var updated = await _repository.AddPaymentAsync(id, request.AmountPaid, DateTime.Now);
        if (updated == null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    public class PaymentRequest
    {
        public int AmountPaid { get; set; }
    }
}
