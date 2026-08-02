using System.Data;
using Microsoft.Data.SqlClient;
using ShivaDigital_API.Models;

namespace ShivaDigital_API.Data;

public class CustomerRepository
{
    private readonly string _connectionString;

    public CustomerRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
    }

    public async Task<List<Customer>> GetAllAsync()
    {
        var result = new List<Customer>();
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand("SELECT CustomerID, CustomerName, MobileNumber, Address, PanNumber, AadharNumber FROM dbo.vvtblCustomers ORDER BY CustomerID", connection);
        await using var reader = await command.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            result.Add(new Customer
            {
                CustomerID = reader.IsDBNull(reader.GetOrdinal("CustomerID")) ? null : reader.GetInt32(reader.GetOrdinal("CustomerID")),
                CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader.GetString(reader.GetOrdinal("CustomerName")),
                MobileNumber = reader.IsDBNull(reader.GetOrdinal("MobileNumber")) ? null : reader.GetString(reader.GetOrdinal("MobileNumber")),
                Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
                PanNumber = reader.IsDBNull(reader.GetOrdinal("PanNumber")) ? null : reader.GetString(reader.GetOrdinal("PanNumber")),
                AadharNumber = reader.IsDBNull(reader.GetOrdinal("AadharNumber")) ? null : reader.GetString(reader.GetOrdinal("AadharNumber"))
            });
        }

        return result;
    }

    public async Task<Customer?> GetByIdAsync(int id)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand("SELECT CustomerID, CustomerName, MobileNumber, Address, PanNumber, AadharNumber FROM dbo.vvtblCustomers WHERE CustomerID = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);
        await using var reader = await command.ExecuteReaderAsync();

        if (!await reader.ReadAsync())
        {
            return null;
        }

        return new Customer
        {
            CustomerID = reader.IsDBNull(reader.GetOrdinal("CustomerID")) ? null : reader.GetInt32(reader.GetOrdinal("CustomerID")),
            CustomerName = reader.IsDBNull(reader.GetOrdinal("CustomerName")) ? null : reader.GetString(reader.GetOrdinal("CustomerName")),
            MobileNumber = reader.IsDBNull(reader.GetOrdinal("MobileNumber")) ? null : reader.GetString(reader.GetOrdinal("MobileNumber")),
            Address = reader.IsDBNull(reader.GetOrdinal("Address")) ? null : reader.GetString(reader.GetOrdinal("Address")),
            PanNumber = reader.IsDBNull(reader.GetOrdinal("PanNumber")) ? null : reader.GetString(reader.GetOrdinal("PanNumber")),
            AadharNumber = reader.IsDBNull(reader.GetOrdinal("AadharNumber")) ? null : reader.GetString(reader.GetOrdinal("AadharNumber"))
        };
    }

    public async Task<Customer> CreateAsync(Customer model)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            INSERT INTO dbo.vvtblCustomers (CustomerName, MobileNumber, Address, PanNumber, AadharNumber)
            OUTPUT INSERTED.CustomerID
            VALUES (@CustomerName, @MobileNumber, @Address, @PanNumber, @AadharNumber)", connection);

        command.Parameters.Add("@CustomerName", SqlDbType.VarChar, 100).Value = (object?)(model.CustomerName ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@MobileNumber", SqlDbType.VarChar, 10).Value = (object?)(model.MobileNumber ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@Address", SqlDbType.VarChar, 1000).Value = (object?)(model.Address ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@PanNumber", SqlDbType.VarChar, 10).Value = (object?)(model.PanNumber ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@AadharNumber", SqlDbType.VarChar, 12).Value = (object?)(model.AadharNumber ?? string.Empty) ?? DBNull.Value;

        var id = Convert.ToInt32(await command.ExecuteScalarAsync());
        model.CustomerID = id;
        return model;
    }

    public async Task<Customer?> UpdateAsync(int id, Customer model)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            UPDATE dbo.vvtblCustomers
            SET CustomerName = @CustomerName,
                MobileNumber = @MobileNumber,
                Address = @Address,
                PanNumber = @PanNumber,
                AadharNumber = @AadharNumber
            WHERE CustomerID = @Id", connection);

        command.Parameters.AddWithValue("@Id", id);
        command.Parameters.Add("@CustomerName", SqlDbType.VarChar, 100).Value = (object?)(model.CustomerName ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@MobileNumber", SqlDbType.VarChar, 10).Value = (object?)(model.MobileNumber ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@Address", SqlDbType.VarChar, 1000).Value = (object?)(model.Address ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@PanNumber", SqlDbType.VarChar, 10).Value = (object?)(model.PanNumber ?? string.Empty) ?? DBNull.Value;
        command.Parameters.Add("@AadharNumber", SqlDbType.VarChar, 12).Value = (object?)(model.AadharNumber ?? string.Empty) ?? DBNull.Value;

        var rows = await command.ExecuteNonQueryAsync();
        if (rows == 0)
        {
            return null;
        }

        model.CustomerID = id;
        return model;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand("DELETE FROM dbo.vvtblCustomers WHERE CustomerID = @Id", connection);
        command.Parameters.AddWithValue("@Id", id);
        var rows = await command.ExecuteNonQueryAsync();
        return rows > 0;
    }
}
