using System.Data;
using System.Text.RegularExpressions;
using System.Linq;
using Microsoft.Data.SqlClient;
using ShivaDigital_API.Models;

namespace ShivaDigital_API.Data;

public class BillRepository
{
    private readonly string _connectionString;

    public BillRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
    }

    public async Task<List<CorrectionUser>> GetCorrectionUsersAsync()
    {
        var result = new List<CorrectionUser>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand("SELECT CorrectionUserID, [Name] FROM dbo.vvtblCorrectionUsers ORDER BY [Name]", connection);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new CorrectionUser
            {
                CorrectionUserID = reader.IsDBNull(reader.GetOrdinal("CorrectionUserID")) ? null : reader.GetInt32(reader.GetOrdinal("CorrectionUserID")),
                Name = reader.IsDBNull(reader.GetOrdinal("Name")) ? null : reader.GetString(reader.GetOrdinal("Name"))
            });
        }

        return result;
    }

    public async Task<List<BillSheetSummary>> SearchByCorrectionUserAsync(DateTime? fromDate, DateTime? toDate, int correctionUserId)
    {
        var result = new List<BillSheetSummary>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT b.BillID, d.SheetTypeID, s.Name AS SheetName, d.Quanity
            FROM dbo.vvtblBill b
            INNER JOIN dbo.vvtblBillDetails d ON d.BillID = b.BillID
            LEFT JOIN dbo.vvtblSheets s ON s.ID = d.SheetTypeID
            WHERE (@FromDate IS NULL OR CAST(b.BillDate AS date) >= CAST(@FromDate AS date))
              AND (@ToDate IS NULL OR CAST(b.BillDate AS date) <= CAST(@ToDate AS date))
              AND b.CorrectionUserID = @CorrectionUserID
              AND d.Quanity > 0
            ORDER BY b.BillID DESC", connection);

        command.Parameters.Add("@FromDate", SqlDbType.Date).Value = (object?)(fromDate ?? (object)DBNull.Value) ?? DBNull.Value;
        command.Parameters.Add("@ToDate", SqlDbType.Date).Value = (object?)(toDate ?? (object)DBNull.Value) ?? DBNull.Value;
        command.Parameters.Add("@CorrectionUserID", SqlDbType.Int).Value = correctionUserId;

        await using var reader = await command.ExecuteReaderAsync();
        var map = new Dictionary<int, BillSheetSummary>();
        while (await reader.ReadAsync())
        {
            var billId = reader.IsDBNull(reader.GetOrdinal("BillID")) ? 0 : reader.GetInt32(reader.GetOrdinal("BillID"));
            if (!map.TryGetValue(billId, out var summary))
            {
                summary = new BillSheetSummary { BillID = billId, Lines = new List<BillLine>() };
                map[billId] = summary;
            }

            var sheetTypeId = reader.IsDBNull(reader.GetOrdinal("SheetTypeID")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("SheetTypeID"));
            var sheetName = reader.IsDBNull(reader.GetOrdinal("SheetName")) ? null : reader.GetString(reader.GetOrdinal("SheetName"));
            var qty = reader.IsDBNull(reader.GetOrdinal("Quanity")) ? (int?)null : reader.GetInt32(reader.GetOrdinal("Quanity"));

            summary.Lines!.Add(new BillLine { SheetTypeID = sheetTypeId, SheetName = sheetName, Quantity = qty });
        }

        return map.Values.ToList();
    }

    public async Task<List<Bill>> GetAllAsync()
    {
        var result = new List<Bill>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT b.BillID, b.CustomerID, c.CustomerName, c.MobileNumber, b.BillDate, b.Files, b.FileSize, b.BookingTime, b.DeliveryTime, b.Total, b.Advance, b.BalancePaid, b.Discount, b.BillType, b.CorrectionUserID, u.Name AS CorrectionUserName
            FROM dbo.vvtblBill b
            LEFT JOIN dbo.vvtblCustomers c ON c.CustomerID = b.CustomerID
            LEFT JOIN dbo.vvtblCorrectionUsers u ON u.CorrectionUserID = b.CorrectionUserID
            ORDER BY b.BillID", connection);
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            result.Add(new Bill
            {
                BillID = reader.IsDBNull(reader.GetOrdinal("BillID")) ? null : reader.GetInt32(reader.GetOrdinal("BillID")),
                CustomerID = reader.IsDBNull(reader.GetOrdinal("CustomerID")) ? null : reader.GetInt32(reader.GetOrdinal("CustomerID")),
                CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader.GetString(reader.GetOrdinal("CustomerName")),
                MobileNumber = reader.IsDBNull(reader.GetOrdinal("MobileNumber")) ? null : reader.GetString(reader.GetOrdinal("MobileNumber")),
                BillDate = reader.IsDBNull(reader.GetOrdinal("BillDate")) ? null : reader.GetDateTime(reader.GetOrdinal("BillDate")),
                Files = reader.IsDBNull(reader.GetOrdinal("Files")) ? null : reader.GetString(reader.GetOrdinal("Files")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize")),
                BookingTime = reader.IsDBNull(reader.GetOrdinal("BookingTime")) ? null : reader.GetDateTime(reader.GetOrdinal("BookingTime")),
                DeliveryTime = reader.IsDBNull(reader.GetOrdinal("DeliveryTime")) ? null : reader.GetDateTime(reader.GetOrdinal("DeliveryTime")),
                Total = reader.IsDBNull(reader.GetOrdinal("Total")) ? null : reader.GetDouble(reader.GetOrdinal("Total")),
                Advance = reader.IsDBNull(reader.GetOrdinal("Advance")) ? null : reader.GetDouble(reader.GetOrdinal("Advance")),
                BalancePaid = reader.IsDBNull(reader.GetOrdinal("BalancePaid")) ? null : reader.GetInt32(reader.GetOrdinal("BalancePaid")),
                Discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? null : reader.GetInt32(reader.GetOrdinal("Discount")),
                BillType = reader.IsDBNull(reader.GetOrdinal("BillType")) ? null : reader.GetString(reader.GetOrdinal("BillType")),
                CorrectionUserID = reader.IsDBNull(reader.GetOrdinal("CorrectionUserID")) ? null : reader.GetInt32(reader.GetOrdinal("CorrectionUserID")),
                CorrectionUserName = reader.IsDBNull(reader.GetOrdinal("CorrectionUserName")) ? null : reader.GetString(reader.GetOrdinal("CorrectionUserName"))
            });
        }

        return result;
    }

    public async Task<List<Bill>> SearchAsync(DateTime? fromDate, DateTime? toDate)
    {
        var result = new List<Bill>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

                await using var command = new SqlCommand(@"
                        SELECT b.BillID, b.CustomerID, c.CustomerName, c.MobileNumber, b.BillDate, b.Files, b.FileSize, b.BookingTime, b.DeliveryTime, b.Total, b.Advance, b.BalancePaid, b.Discount, b.BillType, b.CorrectionUserID, u.Name AS CorrectionUserName
                        FROM dbo.vvtblBill b
                        LEFT JOIN dbo.vvtblCustomers c ON c.CustomerID = b.CustomerID
                        LEFT JOIN dbo.vvtblCorrectionUsers u ON u.CorrectionUserID = b.CorrectionUserID
                        WHERE (@FromDate IS NULL OR CAST(b.BillDate AS date) >= CAST(@FromDate AS date))
                            AND (@ToDate IS NULL OR CAST(b.BillDate AS date) <= CAST(@ToDate AS date))
                        ORDER BY b.BillID DESC", connection);

        command.Parameters.Add("@FromDate", SqlDbType.Date).Value = (object?)(fromDate ?? (object)DBNull.Value) ?? DBNull.Value;
        command.Parameters.Add("@ToDate", SqlDbType.Date).Value = (object?)(toDate ?? (object)DBNull.Value) ?? DBNull.Value;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new Bill
            {
                BillID = reader.IsDBNull(reader.GetOrdinal("BillID")) ? null : reader.GetInt32(reader.GetOrdinal("BillID")),
                CustomerID = reader.IsDBNull(reader.GetOrdinal("CustomerID")) ? null : reader.GetInt32(reader.GetOrdinal("CustomerID")),
                CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader.GetString(reader.GetOrdinal("CustomerName")),
                MobileNumber = reader.IsDBNull(reader.GetOrdinal("MobileNumber")) ? null : reader.GetString(reader.GetOrdinal("MobileNumber")),
                BillDate = reader.IsDBNull(reader.GetOrdinal("BillDate")) ? null : reader.GetDateTime(reader.GetOrdinal("BillDate")),
                Files = reader.IsDBNull(reader.GetOrdinal("Files")) ? null : reader.GetString(reader.GetOrdinal("Files")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize")),
                BookingTime = reader.IsDBNull(reader.GetOrdinal("BookingTime")) ? null : reader.GetDateTime(reader.GetOrdinal("BookingTime")),
                DeliveryTime = reader.IsDBNull(reader.GetOrdinal("DeliveryTime")) ? null : reader.GetDateTime(reader.GetOrdinal("DeliveryTime")),
                Total = reader.IsDBNull(reader.GetOrdinal("Total")) ? null : reader.GetDouble(reader.GetOrdinal("Total")),
                Advance = reader.IsDBNull(reader.GetOrdinal("Advance")) ? null : reader.GetDouble(reader.GetOrdinal("Advance")),
                BalancePaid = reader.IsDBNull(reader.GetOrdinal("BalancePaid")) ? null : reader.GetInt32(reader.GetOrdinal("BalancePaid")),
                Discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? null : reader.GetInt32(reader.GetOrdinal("Discount")),
                BillType = reader.IsDBNull(reader.GetOrdinal("BillType")) ? null : reader.GetString(reader.GetOrdinal("BillType")),
                CorrectionUserID = reader.IsDBNull(reader.GetOrdinal("CorrectionUserID")) ? null : reader.GetInt32(reader.GetOrdinal("CorrectionUserID")),
                CorrectionUserName = reader.IsDBNull(reader.GetOrdinal("CorrectionUserName")) ? null : reader.GetString(reader.GetOrdinal("CorrectionUserName"))
            });
        }

        return result;
    }

    public async Task<List<Bill>> SearchByPaymentDateAsync(DateTime? fromDate, DateTime? toDate)
    {
        var result = new List<Bill>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

                await using var command = new SqlCommand(@"
                        SELECT b.BillID, b.CustomerID, c.CustomerName, c.MobileNumber, b.BillDate, p.PaymentDate, p.AmountPaid AS PaymentAmount, p.PaymentMethod, b.Files, b.FileSize, b.BookingTime, b.DeliveryTime, b.Total, b.Advance, b.BalancePaid, b.Discount, b.BillType, b.CorrectionUserID, u.Name AS CorrectionUserName
                        FROM dbo.vvtblBill b
                        LEFT JOIN dbo.vvtblCustomers c ON c.CustomerID = b.CustomerID
                        LEFT JOIN dbo.vvtblCorrectionUsers u ON u.CorrectionUserID = b.CorrectionUserID
                        INNER JOIN dbo.vvtblBillPayment p ON p.BillID = b.BillID
                        WHERE (@FromDate IS NULL OR CAST(p.PaymentDate AS date) >= CAST(@FromDate AS date))
                            AND (@ToDate IS NULL OR CAST(p.PaymentDate AS date) <= CAST(@ToDate AS date))
                        ORDER BY p.PaymentDate DESC", connection);

        command.Parameters.Add("@FromDate", SqlDbType.Date).Value = (object?)(fromDate ?? (object)DBNull.Value) ?? DBNull.Value;
        command.Parameters.Add("@ToDate", SqlDbType.Date).Value = (object?)(toDate ?? (object)DBNull.Value) ?? DBNull.Value;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new Bill
            {
                BillID = reader.IsDBNull(reader.GetOrdinal("BillID")) ? null : reader.GetInt32(reader.GetOrdinal("BillID")),
                CustomerID = reader.IsDBNull(reader.GetOrdinal("CustomerID")) ? null : reader.GetInt32(reader.GetOrdinal("CustomerID")),
                CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader.GetString(reader.GetOrdinal("CustomerName")),
                MobileNumber = reader.IsDBNull(reader.GetOrdinal("MobileNumber")) ? null : reader.GetString(reader.GetOrdinal("MobileNumber")),
                BillDate = reader.IsDBNull(reader.GetOrdinal("BillDate")) ? null : reader.GetDateTime(reader.GetOrdinal("BillDate")),
                PaymentDate = reader.IsDBNull(reader.GetOrdinal("PaymentDate")) ? null : reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                PaymentAmount = reader.IsDBNull(reader.GetOrdinal("PaymentAmount")) ? null : reader.GetInt32(reader.GetOrdinal("PaymentAmount")),
                PaymentMethod = reader.IsDBNull(reader.GetOrdinal("PaymentMethod")) ? "Others" : reader.GetString(reader.GetOrdinal("PaymentMethod")),
                Files = reader.IsDBNull(reader.GetOrdinal("Files")) ? null : reader.GetString(reader.GetOrdinal("Files")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize")),
                BookingTime = reader.IsDBNull(reader.GetOrdinal("BookingTime")) ? null : reader.GetDateTime(reader.GetOrdinal("BookingTime")),
                DeliveryTime = reader.IsDBNull(reader.GetOrdinal("DeliveryTime")) ? null : reader.GetDateTime(reader.GetOrdinal("DeliveryTime")),
                Total = reader.IsDBNull(reader.GetOrdinal("Total")) ? null : reader.GetDouble(reader.GetOrdinal("Total")),
                Advance = reader.IsDBNull(reader.GetOrdinal("Advance")) ? null : reader.GetDouble(reader.GetOrdinal("Advance")),
                BalancePaid = reader.IsDBNull(reader.GetOrdinal("BalancePaid")) ? null : reader.GetInt32(reader.GetOrdinal("BalancePaid")),
                Discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? null : reader.GetInt32(reader.GetOrdinal("Discount")),
                BillType = reader.IsDBNull(reader.GetOrdinal("BillType")) ? null : reader.GetString(reader.GetOrdinal("BillType")),
                CorrectionUserID = reader.IsDBNull(reader.GetOrdinal("CorrectionUserID")) ? null : reader.GetInt32(reader.GetOrdinal("CorrectionUserID")),
                CorrectionUserName = reader.IsDBNull(reader.GetOrdinal("CorrectionUserName")) ? null : reader.GetString(reader.GetOrdinal("CorrectionUserName"))
            });
        }

        return result;
    }

    public async Task<List<SheetOption>> GetSheetsAsync(string sheetType)
    {
        var result = new List<SheetOption>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT ID, Name, Amount, SheetType, SignatureTitle
            FROM dbo.vvtblSheets
            WHERE SheetType = @SheetType
            ORDER BY DisplayOrder, Name", connection);
        command.Parameters.Add("@SheetType", SqlDbType.VarChar, 20).Value = sheetType;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new SheetOption
            {
                SheetTypeID = reader.IsDBNull(reader.GetOrdinal("ID")) ? null : reader.GetInt32(reader.GetOrdinal("ID")),
                Name = reader.IsDBNull(reader.GetOrdinal("Name")) ? null : reader.GetString(reader.GetOrdinal("Name")),
                Amount = reader.IsDBNull(reader.GetOrdinal("Amount")) ? null : reader.GetDouble(reader.GetOrdinal("Amount")),
                SheetType = reader.IsDBNull(reader.GetOrdinal("SheetType")) ? null : reader.GetString(reader.GetOrdinal("SheetType")),
                SignatureTitle = reader.IsDBNull(reader.GetOrdinal("SignatureTitle")) ? null : reader.GetString(reader.GetOrdinal("SignatureTitle"))
            });
        }

        return result;
    }

    public async Task<List<FileSizeOption>> GetFileSizesAsync()
    {
        var result = new List<FileSizeOption>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand("SELECT ID, FileSize FROM dbo.vvtblFileSize ORDER BY FileSize", connection);
        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new FileSizeOption
            {
                ID = reader.IsDBNull(reader.GetOrdinal("ID")) ? null : reader.GetInt32(reader.GetOrdinal("ID")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetString(reader.GetOrdinal("FileSize"))
            });
        }

        return result;
    }

    public async Task<List<SheetInventory>> GetInventoryAsync(string sheetType)
    {
        var result = new List<SheetInventory>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT s.ID AS SheetTypeID, s.Name, ISNULL(i.Quantity,0) AS Quantity, ISNULL(i.FileSize, 0) AS FileSize
            FROM dbo.vvtblSheets s
            LEFT JOIN dbo.vvtblSheetInventory i ON i.SheetTypeID = s.ID
            WHERE s.SheetType = @SheetType
            ORDER BY s.DisplayOrder, s.Name, ISNULL(i.FileSize, 0)", connection);
        command.Parameters.Add("@SheetType", SqlDbType.VarChar, 20).Value = sheetType;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new SheetInventory
            {
                SheetTypeID = reader.IsDBNull(reader.GetOrdinal("SheetTypeID")) ? null : reader.GetInt32(reader.GetOrdinal("SheetTypeID")),
                Name = reader.IsDBNull(reader.GetOrdinal("Name")) ? null : reader.GetString(reader.GetOrdinal("Name")),
                Quantity = reader.IsDBNull(reader.GetOrdinal("Quantity")) ? 0 : reader.GetInt32(reader.GetOrdinal("Quantity")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize"))
            });
        }

        return result;
    }

    public async Task<List<SheetInventory>> GetInventoryByFileSizeAsync(int fileSize)
    {
        var result = new List<SheetInventory>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT i.SheetTypeID, s.Name, i.Quantity, i.FileSize
            FROM dbo.vvtblSheetInventory i
            LEFT JOIN dbo.vvtblSheets s ON s.ID = i.SheetTypeID
            WHERE i.FileSize = @FileSize
            ORDER BY s.DisplayOrder, s.Name", connection);
        command.Parameters.Add("@FileSize", SqlDbType.Int).Value = fileSize;

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new SheetInventory
            {
                SheetTypeID = reader.IsDBNull(reader.GetOrdinal("SheetTypeID")) ? null : reader.GetInt32(reader.GetOrdinal("SheetTypeID")),
                Name = reader.IsDBNull(reader.GetOrdinal("Name")) ? null : reader.GetString(reader.GetOrdinal("Name")),
                Quantity = reader.IsDBNull(reader.GetOrdinal("Quantity")) ? 0 : reader.GetInt32(reader.GetOrdinal("Quantity")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize"))
            });
        }

        return result;
    }

    public async Task<List<SheetInventory>> GetInventoryAllByFileSizeAsync()
    {
        var result = new List<SheetInventory>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT i.FileSize, SUM(i.Quantity) AS Quantity
            FROM dbo.vvtblSheetInventory i
            WHERE i.FileSize IS NOT NULL
            GROUP BY i.FileSize
            ORDER BY i.FileSize", connection);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new SheetInventory
            {
                SheetTypeID = null,
                Name = null,
                Quantity = reader.IsDBNull(reader.GetOrdinal("Quantity")) ? 0 : reader.GetInt32(reader.GetOrdinal("Quantity")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize"))
            });
        }

        return result;
    }

    public async Task<List<SheetInventoryTx>> GetInventoryTransactionsAsync(int? sheetTypeId, int? fileSize, DateTime? fromDate, DateTime? toDate, string? txType, int page = 1, int pageSize = 100)
    {
        var result = new List<SheetInventoryTx>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var where = "WHERE 1=1";
        if (sheetTypeId.HasValue) where += " AND SheetTypeID = @SheetTypeID";
        if (fileSize.HasValue) where += " AND FileSize = @FileSize";
        if (fromDate.HasValue) where += " AND TxDate >= @FromDate";
        if (toDate.HasValue) where += " AND TxDate <= @ToDate";
        if (!string.IsNullOrEmpty(txType)) where += " AND TxType = @TxType";

        var sql = $@"
            SELECT TxID, SheetTypeID, TxDate, TxType, Quantity, SourceType, SourceRef, PerformedBy, Comment, FileSize, BalanceAfter
            FROM dbo.vvtblSheetInventoryTx
            {where}
            ORDER BY TxDate DESC
            OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY";

        await using var cmd = new SqlCommand(sql, connection);
        if (sheetTypeId.HasValue) cmd.Parameters.Add("@SheetTypeID", SqlDbType.Int).Value = sheetTypeId.Value;
        if (fileSize.HasValue) cmd.Parameters.Add("@FileSize", SqlDbType.Int).Value = fileSize.Value;
        if (fromDate.HasValue) cmd.Parameters.Add("@FromDate", SqlDbType.DateTime2).Value = fromDate.Value;
        if (toDate.HasValue) cmd.Parameters.Add("@ToDate", SqlDbType.DateTime2).Value = toDate.Value;
        if (!string.IsNullOrEmpty(txType)) cmd.Parameters.Add("@TxType", SqlDbType.VarChar, 10).Value = txType;
        cmd.Parameters.Add("@Offset", SqlDbType.Int).Value = (page - 1) * pageSize;
        cmd.Parameters.Add("@PageSize", SqlDbType.Int).Value = pageSize;

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            result.Add(new SheetInventoryTx
            {
                TxID = reader.IsDBNull(reader.GetOrdinal("TxID")) ? null : reader.GetInt32(reader.GetOrdinal("TxID")),
                SheetTypeID = reader.IsDBNull(reader.GetOrdinal("SheetTypeID")) ? null : reader.GetInt32(reader.GetOrdinal("SheetTypeID")),
                TxDate = reader.IsDBNull(reader.GetOrdinal("TxDate")) ? null : reader.GetDateTime(reader.GetOrdinal("TxDate")),
                TxType = reader.IsDBNull(reader.GetOrdinal("TxType")) ? null : reader.GetString(reader.GetOrdinal("TxType")),
                Quantity = reader.IsDBNull(reader.GetOrdinal("Quantity")) ? null : reader.GetInt32(reader.GetOrdinal("Quantity")),
                SourceType = reader.IsDBNull(reader.GetOrdinal("SourceType")) ? null : reader.GetString(reader.GetOrdinal("SourceType")),
                SourceRef = reader.IsDBNull(reader.GetOrdinal("SourceRef")) ? null : reader.GetString(reader.GetOrdinal("SourceRef")),
                PerformedBy = reader.IsDBNull(reader.GetOrdinal("PerformedBy")) ? null : reader.GetString(reader.GetOrdinal("PerformedBy")),
                Comment = reader.IsDBNull(reader.GetOrdinal("Comment")) ? null : reader.GetString(reader.GetOrdinal("Comment")),
                FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize")),
                BalanceAfter = reader.IsDBNull(reader.GetOrdinal("BalanceAfter")) ? null : reader.GetInt32(reader.GetOrdinal("BalanceAfter"))
            });
        }

        return result;
    }

    public async Task AddInventoryAsync(int? sheetTypeId, int quantityDelta, string? sourceType = null, string? sourceRef = null, string? performedBy = null, string? comment = null, int? fileSize = null)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        var currentQty = 0;
        int? sId = sheetTypeId;
        int? fSize = fileSize;

        // Read existing quantity for the matching bucket (handle NULL comparison)
        var readSql = @"SELECT Quantity FROM dbo.vvtblSheetInventory
                         WHERE (SheetTypeID = @SheetTypeID OR (SheetTypeID IS NULL AND @SheetTypeID IS NULL))
                           AND (FileSize = @FileSize OR (FileSize IS NULL AND @FileSize IS NULL))";
        await using (var readCmd = new SqlCommand(readSql, connection))
        {
            readCmd.Parameters.Add("@SheetTypeID", SqlDbType.Int).Value = (object?)sId ?? DBNull.Value;
            readCmd.Parameters.Add("@FileSize", SqlDbType.Int).Value = (object?)fSize ?? DBNull.Value;
            var obj = await readCmd.ExecuteScalarAsync();
            if (obj != null && obj != DBNull.Value)
            {
                currentQty = Convert.ToInt32(obj);
            }
        }

        var newQty = currentQty + quantityDelta;

        // Upsert: increment existing quantity or insert new row (use NULL-aware comparisons)
        var upsertSql = @"
            IF EXISTS (SELECT 1 FROM dbo.vvtblSheetInventory WHERE (SheetTypeID = @SheetTypeID OR (SheetTypeID IS NULL AND @SheetTypeID IS NULL)) AND (FileSize = @FileSize OR (FileSize IS NULL AND @FileSize IS NULL)))
                UPDATE dbo.vvtblSheetInventory SET Quantity = @NewQty WHERE (SheetTypeID = @SheetTypeID OR (SheetTypeID IS NULL AND @SheetTypeID IS NULL)) AND (FileSize = @FileSize OR (FileSize IS NULL AND @FileSize IS NULL))
            ELSE
                INSERT INTO dbo.vvtblSheetInventory (SheetTypeID, FileSize, Quantity) VALUES (@SheetTypeID, @FileSize, @NewQty)";

        await using (var upsertCmd = new SqlCommand(upsertSql, connection))
        {
            upsertCmd.Parameters.Add("@SheetTypeID", SqlDbType.Int).Value = (object?)sId ?? DBNull.Value;
            upsertCmd.Parameters.Add("@NewQty", SqlDbType.Int).Value = newQty;
            upsertCmd.Parameters.Add("@FileSize", SqlDbType.Int).Value = (object?)fSize ?? DBNull.Value;
            await upsertCmd.ExecuteNonQueryAsync();
        }

        // insert transaction record
        var txType = quantityDelta >= 0 ? "IN" : "OUT";
        var txQty = Math.Abs(quantityDelta);
        await using (var txCmd = new SqlCommand(@"
            INSERT INTO dbo.vvtblSheetInventoryTx (SheetTypeID, TxDate, TxType, Quantity, SourceType, SourceRef, PerformedBy, Comment, FileSize, BalanceAfter)
            VALUES (@SheetTypeID, SYSDATETIME(), @TxType, @Quantity, @SourceType, @SourceRef, @PerformedBy, @Comment, @FileSize, @BalanceAfter)", connection))
        {
            txCmd.Parameters.Add("@SheetTypeID", SqlDbType.Int).Value = (object?)sId ?? DBNull.Value;
            txCmd.Parameters.Add("@TxType", SqlDbType.VarChar, 10).Value = txType;
            txCmd.Parameters.Add("@Quantity", SqlDbType.Int).Value = txQty;
            txCmd.Parameters.Add("@SourceType", SqlDbType.VarChar, 32).Value = (object?)sourceType ?? DBNull.Value;
            txCmd.Parameters.Add("@SourceRef", SqlDbType.VarChar, 128).Value = (object?)sourceRef ?? DBNull.Value;
            txCmd.Parameters.Add("@PerformedBy", SqlDbType.VarChar, 128).Value = (object?)performedBy ?? DBNull.Value;
            txCmd.Parameters.Add("@Comment", SqlDbType.VarChar, 512).Value = (object?)comment ?? DBNull.Value;
            txCmd.Parameters.Add("@FileSize", SqlDbType.Int).Value = (object?)fSize ?? DBNull.Value;
            txCmd.Parameters.Add("@BalanceAfter", SqlDbType.Int).Value = newQty;
            await txCmd.ExecuteNonQueryAsync();
        }
    }

    public async Task<Bill> CreateAsync(Bill model)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        model.BillDate ??= DateTime.Now;
        model.BookingTime ??= DateTime.Now;
        model.DeliveryTime ??= DateTime.Now.AddDays(1);
        model.Total ??= 0;
        model.Advance ??= 0;
        model.BalancePaid ??= 0;
        model.Discount ??= 0;
        model.BillType ??= "Standard";
        UpdateComputedPaymentTotals(model);

        await using var command = new SqlCommand(@"
            INSERT INTO dbo.vvtblBill (CustomerID, BillDate, Files, FileSize, BookingTime, DeliveryTime, Total, Advance, BalancePaid, Discount, BillType, CorrectionUserID)
            VALUES (@CustomerID, @BillDate, @Files, @FileSize, @BookingTime, @DeliveryTime, @Total, @Advance, @BalancePaid, @Discount, @BillType, @CorrectionUserID)
            select cast(SCOPE_IDENTITY() as int)
            ", connection);

        command.Parameters.Add("@CustomerID", SqlDbType.Int).Value = (model.CustomerID ?? 0);
        command.Parameters.Add("@BillDate", SqlDbType.Date).Value = (model.BillDate ?? DateTime.Now);
        command.Parameters.Add("@Files", SqlDbType.VarChar, 100).Value = (object?)(model.Files ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@FileSize", SqlDbType.Int).Value = (model.FileSize ?? 0);
        command.Parameters.Add("@BookingTime", SqlDbType.DateTime).Value = (model.BookingTime ?? DateTime.Now);
        command.Parameters.Add("@DeliveryTime", SqlDbType.DateTime).Value = (model.DeliveryTime ?? DateTime.Now.AddDays(1));
        command.Parameters.Add("@Total", SqlDbType.Float).Value = (model.Total ?? 0);
        command.Parameters.Add("@Advance", SqlDbType.Float).Value = (model.Advance ?? 0);
        command.Parameters.Add("@BalancePaid", SqlDbType.Int).Value = (model.BalancePaid ?? 0);
        command.Parameters.Add("@Discount", SqlDbType.Int).Value = (model.Discount ?? 0);
        command.Parameters.Add("@BillType", SqlDbType.VarChar, 20).Value = (object?)(model.BillType ?? "Standard") ?? DBNull.Value;
        command.Parameters.Add("@CorrectionUserID", SqlDbType.Int).Value = (model.CorrectionUserID ?? (object)DBNull.Value) ?? DBNull.Value;

        var idObj = await command.ExecuteScalarAsync();
        if (idObj is not null && idObj != DBNull.Value)
        {
            model.BillID = Convert.ToInt32(idObj);
        }
        else
        {
            model.BillID = 0;
        }

        if (model.Lines is { Count: > 0 })
        {
            foreach (var line in model.Lines)
            {
                if (line.Quantity is null || line.Quantity <= 0) continue;
                await using var lineCommand = new SqlCommand(@"
                    INSERT INTO dbo.vvtblBillDetails (BillID, SheetTypeID, Quanity, Price, Amount)
                    VALUES (@BillID, @SheetTypeID, @Quanity, @Price, @Amount)", connection);
                lineCommand.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
                lineCommand.Parameters.Add("@SheetTypeID", SqlDbType.Int).Value = line.SheetTypeID ?? 0;
                lineCommand.Parameters.Add("@Quanity", SqlDbType.Int).Value = line.Quantity ?? 0;
                lineCommand.Parameters.Add("@Price", SqlDbType.Int).Value = (int)(line.Price ?? 0);
                lineCommand.Parameters.Add("@Amount", SqlDbType.Float).Value = (line.Amount ?? 0);
                await lineCommand.ExecuteNonQueryAsync();
                // decrement inventory for this sheet
                if (line.SheetTypeID is not null && (line.Quantity ?? 0) != 0)
                {
                    await AddInventoryAsync(
                        line.SheetTypeID,
                        -(line.Quantity ?? 0),
                        "Bill",
                        model.BillID?.ToString(),
                        model.CorrectionUserName ?? "System",
                        $"Bill {model.BillID} sheet issue",
                        null);
                }
            }
        }

        // adjust file-size inventory (if bill represents files)
        // Parse files count robustly (allow values like "3 files" or "3pcs")
        // If a FileSize is selected on the bill, decrement that file-size bucket by 1 (one bucket per bill)
        if (model.FileSize is not null && model.FileSize > 0)
        {
            await AddInventoryAsync(null, -1, "Bill", model.BillID?.ToString(), model.CorrectionUserName ?? "System", $"Bill {model.BillID} files", model.FileSize);
        }

        if (model.AdvancePayments is { Count: > 0 })
        {
            foreach (var payment in model.AdvancePayments)
            {
                if (payment.AmountPaid is null || payment.AmountPaid <= 0) continue;
                await using var paymentCommand = new SqlCommand(@"
                    INSERT INTO dbo.vvtblBillPayment (BillID, PaymentDate, AmountPaid, PaymentMethod, BillLogID)
                    VALUES (@BillID, @PaymentDate, @AmountPaid, @PaymentMethod, @BillLogID)", connection);
                paymentCommand.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
                paymentCommand.Parameters.Add("@PaymentDate", SqlDbType.DateTime).Value = payment.PaymentDate ?? DateTime.Now;
                paymentCommand.Parameters.Add("@AmountPaid", SqlDbType.Int).Value = payment.AmountPaid ?? 0;
                paymentCommand.Parameters.Add("@PaymentMethod", SqlDbType.VarChar, 20).Value = payment.PaymentMethod ?? "Others";
                paymentCommand.Parameters.Add("@BillLogID", SqlDbType.Int).Value = payment.BillLogID ?? 0;
                await paymentCommand.ExecuteNonQueryAsync();
            }
        }

        // return the full bill (with customer name, lines, payments)
        return await GetByIdAsync(model.BillID ?? 0) ?? model;
    }

    public async Task<Bill> UpdateAsync(Bill model)
    {
        if (model.BillID is null) throw new InvalidOperationException("BillID is required to update a bill.");

        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        UpdateComputedPaymentTotals(model);

        // read existing bill file metadata before updating so we can adjust file-size inventory
        // read existing bill file-size before updating so we can adjust file-size inventory
        int? oldFileSize = null;
        await using (var oldBillCmd = new SqlCommand("SELECT FileSize FROM dbo.vvtblBill WHERE BillID = @BillID", connection))
        {
            oldBillCmd.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
            await using var orr = await oldBillCmd.ExecuteReaderAsync();
            if (await orr.ReadAsync())
            {
                oldFileSize = orr.IsDBNull(orr.GetOrdinal("FileSize")) ? null : orr.GetInt32(orr.GetOrdinal("FileSize"));
            }
        }

        await using var command = new SqlCommand(@"
            UPDATE dbo.vvtblBill
            SET CustomerID = @CustomerID,
                BillDate = @BillDate,
                Files = @Files,
                FileSize = @FileSize,
                BookingTime = @BookingTime,
                DeliveryTime = @DeliveryTime,
                Total = @Total,
                Advance = @Advance,
                BalancePaid = @BalancePaid,
                Discount = @Discount,
                    BillType = @BillType,
                    CorrectionUserID = @CorrectionUserID
            WHERE BillID = @BillID", connection);

        command.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
        command.Parameters.Add("@CustomerID", SqlDbType.Int).Value = (model.CustomerID ?? 0);
        command.Parameters.Add("@BillDate", SqlDbType.Date).Value = (model.BillDate ?? DateTime.Now);
        command.Parameters.Add("@Files", SqlDbType.VarChar, 100).Value = (object?)(model.Files ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@FileSize", SqlDbType.Int).Value = (model.FileSize ?? 0);
        command.Parameters.Add("@BookingTime", SqlDbType.DateTime).Value = (model.BookingTime ?? DateTime.Now);
        command.Parameters.Add("@DeliveryTime", SqlDbType.DateTime).Value = (model.DeliveryTime ?? DateTime.Now.AddDays(1));
        command.Parameters.Add("@Total", SqlDbType.Float).Value = (model.Total ?? 0);
        command.Parameters.Add("@Advance", SqlDbType.Float).Value = (model.Advance ?? 0);
        command.Parameters.Add("@BalancePaid", SqlDbType.Int).Value = (model.BalancePaid ?? 0);
        command.Parameters.Add("@Discount", SqlDbType.Int).Value = (model.Discount ?? 0);
        command.Parameters.Add("@BillType", SqlDbType.VarChar, 20).Value = (object?)(model.BillType ?? "Standard") ?? DBNull.Value;
        command.Parameters.Add("@CorrectionUserID", SqlDbType.Int).Value = (model.CorrectionUserID ?? (object)DBNull.Value) ?? DBNull.Value;

        await command.ExecuteNonQueryAsync();

        // load existing details so we can adjust inventory based on differences
        var oldDetails = new Dictionary<int, int>();
        await using (var oldCmd = new SqlCommand("SELECT SheetTypeID, Quanity FROM dbo.vvtblBillDetails WHERE BillID = @BillID", connection))
        {
            oldCmd.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
            await using var or = await oldCmd.ExecuteReaderAsync();
            while (await or.ReadAsync())
            {
                var sid = or.IsDBNull(or.GetOrdinal("SheetTypeID")) ? 0 : or.GetInt32(or.GetOrdinal("SheetTypeID"));
                var q = or.IsDBNull(or.GetOrdinal("Quanity")) ? 0 : or.GetInt32(or.GetOrdinal("Quanity"));
                if (sid != 0) oldDetails[sid] = oldDetails.ContainsKey(sid) ? oldDetails[sid] + q : q;
            }
        }

        // delete existing details and payments
        await using (var delDetails = new SqlCommand("DELETE FROM dbo.vvtblBillDetails WHERE BillID = @BillID", connection))
        {
            delDetails.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
            await delDetails.ExecuteNonQueryAsync();
        }

        await using (var delPayments = new SqlCommand("DELETE FROM dbo.vvtblBillPayment WHERE BillID = @BillID", connection))
        {
            delPayments.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
            await delPayments.ExecuteNonQueryAsync();
        }

        // reinsert lines
        // reinsert lines
        var newDetails = new Dictionary<int, int>();
        if (model.Lines is { Count: > 0 })
        {
            foreach (var line in model.Lines)
            {
                if (line.Quantity is null || line.Quantity <= 0) continue;
                await using var lineCommand = new SqlCommand(@"
                    INSERT INTO dbo.vvtblBillDetails (BillID, SheetTypeID, Quanity, Price, Amount)
                    VALUES (@BillID, @SheetTypeID, @Quanity, @Price, @Amount)", connection);
                lineCommand.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
                lineCommand.Parameters.Add("@SheetTypeID", SqlDbType.Int).Value = line.SheetTypeID ?? 0;
                lineCommand.Parameters.Add("@Quanity", SqlDbType.Int).Value = line.Quantity ?? 0;
                lineCommand.Parameters.Add("@Price", SqlDbType.Int).Value = (int)(line.Price ?? 0);
                lineCommand.Parameters.Add("@Amount", SqlDbType.Float).Value = (line.Amount ?? 0);
                await lineCommand.ExecuteNonQueryAsync();

                if (line.SheetTypeID is not null && (line.Quantity ?? 0) != 0)
                {
                    var sid = line.SheetTypeID ?? 0;
                    newDetails[sid] = newDetails.ContainsKey(sid) ? newDetails[sid] + (line.Quantity ?? 0) : (line.Quantity ?? 0);
                }
            }
        }

        // adjust inventory: for each sheet, calculate old - new (positive means return to stock)
        var allKeys = new HashSet<int>(oldDetails.Keys.Concat(newDetails.Keys));
        foreach (var sid in allKeys)
        {
            oldDetails.TryGetValue(sid, out var oldQ);
            newDetails.TryGetValue(sid, out var newQ);
            var delta = oldQ - newQ; // positive -> add back to inventory, negative -> reduce more
            if (delta != 0)
            {
                await AddInventoryAsync(
                    sid,
                    delta,
                    "Bill",
                    model.BillID?.ToString(),
                    model.CorrectionUserName ?? "System",
                    $"Bill {model.BillID} inventory adjustment",
                    null);
            }
        }

        // adjust file-size inventory: treat file-size as a per-bill bucket (count = 1)
        var newFileSize = model.FileSize;
        if (oldFileSize != newFileSize)
        {
            if (oldFileSize is not null && oldFileSize > 0)
            {
                await AddInventoryAsync(
                    null,
                    1,
                    "Bill",
                    model.BillID?.ToString(),
                    model.CorrectionUserName ?? "System",
                    $"Bill {model.BillID} file-size bucket return",
                    oldFileSize);
            }
            if (newFileSize is not null && newFileSize > 0)
            {
                await AddInventoryAsync(
                    null,
                    -1,
                    "Bill",
                    model.BillID?.ToString(),
                    model.CorrectionUserName ?? "System",
                    $"Bill {model.BillID} file-size bucket deduction",
                    newFileSize);
            }
        }

        // reinsert payments
        if (model.AdvancePayments is { Count: > 0 })
        {
            foreach (var payment in model.AdvancePayments)
            {
                if (payment.AmountPaid is null || payment.AmountPaid <= 0) continue;
                await using var paymentCommand = new SqlCommand(@"
                    INSERT INTO dbo.vvtblBillPayment (BillID, PaymentDate, AmountPaid, PaymentMethod, BillLogID)
                    VALUES (@BillID, @PaymentDate, @AmountPaid, @PaymentMethod, @BillLogID)", connection);
                paymentCommand.Parameters.Add("@BillID", SqlDbType.Int).Value = model.BillID ?? 0;
                paymentCommand.Parameters.Add("@PaymentDate", SqlDbType.DateTime).Value = payment.PaymentDate ?? DateTime.Now;
                paymentCommand.Parameters.Add("@AmountPaid", SqlDbType.Int).Value = payment.AmountPaid ?? 0;
                paymentCommand.Parameters.Add("@PaymentMethod", SqlDbType.VarChar, 20).Value = payment.PaymentMethod ?? "Others";
                paymentCommand.Parameters.Add("@BillLogID", SqlDbType.Int).Value = payment.BillLogID ?? 0;
                await paymentCommand.ExecuteNonQueryAsync();
            }
        }

        // return the full, up-to-date bill
        return await GetByIdAsync(model.BillID ?? 0) ?? model;
    }

    public async Task<Bill?> AddPaymentAsync(int billId, int amount, string paymentMethod, DateTime? paymentDate = null)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            INSERT INTO dbo.vvtblBillPayment (BillID, PaymentDate, AmountPaid, PaymentMethod, BillLogID)
            VALUES (@BillID, @PaymentDate, @AmountPaid, @PaymentMethod, @BillLogID)", connection);

        command.Parameters.Add("@BillID", SqlDbType.Int).Value = billId;
        command.Parameters.Add("@PaymentDate", SqlDbType.DateTime).Value = paymentDate ?? DateTime.Now;
        command.Parameters.Add("@AmountPaid", SqlDbType.Int).Value = amount;
        command.Parameters.Add("@PaymentMethod", SqlDbType.VarChar, 20).Value = paymentMethod;
        command.Parameters.Add("@BillLogID", SqlDbType.Int).Value = 0;
        await command.ExecuteNonQueryAsync();

        return await GetByIdAsync(billId);
    }

    public async Task<Bill?> GetByIdAsync(int id)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        Bill? bill = null;

        await using var command = new SqlCommand(@"
            SELECT b.BillID, b.CustomerID, c.CustomerName, c.MobileNumber, b.BillDate, b.Files, b.FileSize, b.BookingTime, b.DeliveryTime, b.Total, b.Advance, b.BalancePaid, b.Discount, b.BillType, b.CorrectionUserID, u.Name AS CorrectionUserName
            FROM dbo.vvtblBill b
            LEFT JOIN dbo.vvtblCustomers c ON c.CustomerID = b.CustomerID
            LEFT JOIN dbo.vvtblCorrectionUsers u ON u.CorrectionUserID = b.CorrectionUserID
            WHERE b.BillID = @BillID", connection);
        command.Parameters.Add("@BillID", SqlDbType.Int).Value = id;

        await using (var reader = await command.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                bill = new Bill
                {
                    BillID = reader.IsDBNull(reader.GetOrdinal("BillID")) ? null : reader.GetInt32(reader.GetOrdinal("BillID")),
                    CustomerID = reader.IsDBNull(reader.GetOrdinal("CustomerID")) ? null : reader.GetInt32(reader.GetOrdinal("CustomerID")),
                    CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader.GetString(reader.GetOrdinal("CustomerName")),
                    MobileNumber = reader.IsDBNull(reader.GetOrdinal("MobileNumber")) ? null : reader.GetString(reader.GetOrdinal("MobileNumber")),
                    BillDate = reader.IsDBNull(reader.GetOrdinal("BillDate")) ? null : reader.GetDateTime(reader.GetOrdinal("BillDate")),
                    Files = reader.IsDBNull(reader.GetOrdinal("Files")) ? null : reader.GetString(reader.GetOrdinal("Files")),
                    FileSize = reader.IsDBNull(reader.GetOrdinal("FileSize")) ? null : reader.GetInt32(reader.GetOrdinal("FileSize")),
                    BookingTime = reader.IsDBNull(reader.GetOrdinal("BookingTime")) ? null : reader.GetDateTime(reader.GetOrdinal("BookingTime")),
                    DeliveryTime = reader.IsDBNull(reader.GetOrdinal("DeliveryTime")) ? null : reader.GetDateTime(reader.GetOrdinal("DeliveryTime")),
                    Total = reader.IsDBNull(reader.GetOrdinal("Total")) ? null : (double?)Convert.ToDouble(reader.GetValue(reader.GetOrdinal("Total"))),
                    Advance = reader.IsDBNull(reader.GetOrdinal("Advance")) ? null : (double?)Convert.ToDouble(reader.GetValue(reader.GetOrdinal("Advance"))),
                    BalancePaid = reader.IsDBNull(reader.GetOrdinal("BalancePaid")) ? null : reader.GetInt32(reader.GetOrdinal("BalancePaid")),
                    Discount = reader.IsDBNull(reader.GetOrdinal("Discount")) ? null : reader.GetInt32(reader.GetOrdinal("Discount")),
                    BillType = reader.IsDBNull(reader.GetOrdinal("BillType")) ? null : reader.GetString(reader.GetOrdinal("BillType"))
                    ,
                    CorrectionUserID = reader.IsDBNull(reader.GetOrdinal("CorrectionUserID")) ? null : reader.GetInt32(reader.GetOrdinal("CorrectionUserID")),
                    CorrectionUserName = reader.IsDBNull(reader.GetOrdinal("CorrectionUserName")) ? null : reader.GetString(reader.GetOrdinal("CorrectionUserName"))
                };
            }
        }

        if (bill == null) return null;

        // load lines with sheet names
        bill.Lines = new List<BillLine>();
        await using (var linesCmd = new SqlCommand(@"
            SELECT d.SheetTypeID, s.Name AS SheetName, s.SignatureTitle, d.Quanity, d.Price, d.Amount
            FROM dbo.vvtblBillDetails d
            LEFT JOIN dbo.vvtblSheets s ON s.ID = d.SheetTypeID
            WHERE d.BillID = @BillID", connection))
        {
            linesCmd.Parameters.Add("@BillID", SqlDbType.Int).Value = bill.BillID ?? 0;
            await using var lr = await linesCmd.ExecuteReaderAsync();
            while (await lr.ReadAsync())
            {
                bill.Lines.Add(new BillLine
                {
                    SheetTypeID = lr.IsDBNull(lr.GetOrdinal("SheetTypeID")) ? null : lr.GetInt32(lr.GetOrdinal("SheetTypeID")),
                    SheetName = lr.IsDBNull(lr.GetOrdinal("SheetName")) ? null : lr.GetString(lr.GetOrdinal("SheetName")),
                    SignatureTitle = lr.IsDBNull(lr.GetOrdinal("SignatureTitle")) ? null : lr.GetString(lr.GetOrdinal("SignatureTitle")),
                    Quantity = lr.IsDBNull(lr.GetOrdinal("Quanity")) ? null : lr.GetInt32(lr.GetOrdinal("Quanity")),
                    Price = lr.IsDBNull(lr.GetOrdinal("Price")) ? null : (double?)Convert.ToDouble(lr.GetValue(lr.GetOrdinal("Price"))),
                    Amount = lr.IsDBNull(lr.GetOrdinal("Amount")) ? null : (double?)Convert.ToDouble(lr.GetValue(lr.GetOrdinal("Amount")))
                });
            }
        }

        // load payments
        bill.AdvancePayments = new List<BillPayment>();
        await using (var payCmd = new SqlCommand(@"SELECT BillPaymentID, BillID, PaymentDate, AmountPaid, PaymentMethod, BillLogID FROM dbo.vvtblBillPayment WHERE BillID = @BillID", connection))
        {
            payCmd.Parameters.Add("@BillID", SqlDbType.Int).Value = bill.BillID ?? 0;
            await using var pr = await payCmd.ExecuteReaderAsync();
            while (await pr.ReadAsync())
            {
                bill.AdvancePayments.Add(new BillPayment
                {
                    BillPaymentID = pr.IsDBNull(pr.GetOrdinal("BillPaymentID")) ? null : pr.GetInt32(pr.GetOrdinal("BillPaymentID")),
                    BillID = pr.IsDBNull(pr.GetOrdinal("BillID")) ? null : pr.GetInt32(pr.GetOrdinal("BillID")),
                    PaymentDate = pr.IsDBNull(pr.GetOrdinal("PaymentDate")) ? null : pr.GetDateTime(pr.GetOrdinal("PaymentDate")),
                    AmountPaid = pr.IsDBNull(pr.GetOrdinal("AmountPaid")) ? null : pr.GetInt32(pr.GetOrdinal("AmountPaid")),
                    PaymentMethod = pr.IsDBNull(pr.GetOrdinal("PaymentMethod")) ? "Others" : pr.GetString(pr.GetOrdinal("PaymentMethod")),
                    BillLogID = pr.IsDBNull(pr.GetOrdinal("BillLogID")) ? null : pr.GetInt32(pr.GetOrdinal("BillLogID"))
                });
            }
        }

        UpdateComputedPaymentTotals(bill);
        return bill;
    }

    private static void UpdateComputedPaymentTotals(Bill model)
    {
        var totalPaid = model.AdvancePayments?.Where(p => p.AmountPaid.HasValue).Sum(p => p.AmountPaid ?? 0) ?? 0;
        model.BalancePaid = totalPaid;
    }

}
        
