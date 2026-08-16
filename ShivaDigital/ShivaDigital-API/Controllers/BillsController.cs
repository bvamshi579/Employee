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

    [HttpGet("search/payments")]
    public async Task<ActionResult<IEnumerable<Bill>>> SearchBillsByPaymentDate([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate)
    {
        var effectiveFrom = fromDate ?? DateTime.Today.AddMonths(-1);
        var effectiveTo = toDate ?? DateTime.Today;
        var bills = await _repository.SearchByPaymentDateAsync(effectiveFrom, effectiveTo);
        return Ok(bills);
    }

    [HttpGet("sheets/{sheetType}")]
    public async Task<ActionResult<IEnumerable<SheetOption>>> GetSheets(string sheetType)
    {
        var sheets = await _repository.GetSheetsAsync(sheetType);
        return Ok(sheets);
    }

    [HttpGet("correction-users")]
    public async Task<ActionResult<IEnumerable<CorrectionUser>>> GetCorrectionUsers()
    {
        var users = await _repository.GetCorrectionUsersAsync();
        return Ok(users);
    }

    [HttpGet("search/by-correction-user")]
    public async Task<ActionResult<IEnumerable<BillSheetSummary>>> SearchByCorrectionUser([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int correctionUserId)
    {
        var effectiveFrom = fromDate;
        var effectiveTo = toDate;
        var rows = await _repository.SearchByCorrectionUserAsync(effectiveFrom, effectiveTo, correctionUserId);
        return Ok(rows);
    }

    [HttpGet("filesizes")]
    public async Task<ActionResult<IEnumerable<FileSizeOption>>> GetFileSizes()
    {
        var fileSizes = await _repository.GetFileSizesAsync();
        return Ok(fileSizes);
    }

    [HttpGet("inventory/{sheetType}")]
    public async Task<ActionResult<IEnumerable<SheetInventory>>> GetInventory(string sheetType)
    {
        var inv = await _repository.GetInventoryAsync(sheetType);
        return Ok(inv);
    }

    [HttpGet("inventory/filesize/{fileSize}")]
    public async Task<ActionResult<IEnumerable<SheetInventory>>> GetInventoryByFileSize(int fileSize)
    {
        var inv = await _repository.GetInventoryByFileSizeAsync(fileSize);
        return Ok(inv);
    }

    [HttpGet("inventory/filesizes/summary")]
    public async Task<ActionResult<IEnumerable<SheetInventory>>> GetInventoryAllByFileSize()
    {
        var inv = await _repository.GetInventoryAllByFileSizeAsync();
        return Ok(inv);
    }

    [HttpPost("inventory")]
    public async Task<IActionResult> AddInventory([FromBody] InventoryRequest req)
    {
        if (req == null || req.Quantity == 0) return BadRequest();
        var hasSheet = (req.SheetTypeID ?? 0) > 0;
        var hasFile = (req.FileSize ?? 0) > 0;
        if (hasSheet == hasFile) return BadRequest("Provide either SheetTypeID or FileSize (but not both).");
        await _repository.AddInventoryAsync(req.SheetTypeID, req.Quantity, req.SourceType, req.SourceRef, req.PerformedBy, req.Comment, req.FileSize);
        return Ok();
    }

    [HttpGet("inventory/transactions")]
    public async Task<ActionResult<IEnumerable<SheetInventoryTx>>> GetInventoryTransactions([FromQuery] int? sheetTypeId, [FromQuery] int? fileSize, [FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] string? txType, [FromQuery] int page = 1, [FromQuery] int pageSize = 100)
    {
        // Interpret incoming dates as date-only values: include the full `toDate` day.
        DateTime? effectiveFrom = fromDate?.Date;
        DateTime? effectiveTo = toDate.HasValue ? toDate.Value.Date.AddDays(1).AddTicks(-1) : (DateTime?)null;
        var rows = await _repository.GetInventoryTransactionsAsync(sheetTypeId, fileSize, effectiveFrom, effectiveTo, txType, page, pageSize);
        return Ok(rows);
    }

    [HttpPost("inventory/transactions")]
    public async Task<IActionResult> AddInventoryTransaction([FromBody] InventoryTxRequest req)
    {
        if (req == null || req.Quantity == 0 || string.IsNullOrEmpty(req.TxType)) return BadRequest();
        var hasSheet = (req.SheetTypeID ?? 0) > 0;
        var hasFile = (req.FileSize ?? 0) > 0;
        if (hasSheet == hasFile) return BadRequest("Provide either SheetTypeID or FileSize (but not both).");
        var delta = req.TxType.ToUpper() == "IN" ? Math.Abs(req.Quantity) : -Math.Abs(req.Quantity);
        await _repository.AddInventoryAsync(req.SheetTypeID, delta, req.SourceType, req.SourceRef, req.PerformedBy, req.Comment, req.FileSize);
        return Ok();
    }

    [HttpPost]
    public async Task<ActionResult<Bill>> CreateBill(Bill bill)
    {
        var created = await _repository.CreateAsync(bill);
        return CreatedAtAction(nameof(GetBills), new { id = created.BillID ?? 0 }, created);
    }

    public class InventoryRequest
    {
        public int? SheetTypeID { get; set; }
        public int Quantity { get; set; }
        public string? SourceType { get; set; }
        public string? SourceRef { get; set; }
        public string? PerformedBy { get; set; }
        public string? Comment { get; set; }
        public int? FileSize { get; set; }
    }

    public class InventoryTxRequest
    {
        public int? SheetTypeID { get; set; }
        public string? TxType { get; set; }
        public int Quantity { get; set; }
        public string? SourceType { get; set; }
        public string? SourceRef { get; set; }
        public string? PerformedBy { get; set; }
        public string? Comment { get; set; }
        public int? FileSize { get; set; }
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
