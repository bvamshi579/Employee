using System.Data;
using Microsoft.Data.SqlClient;
using ShivaDigital_API.Models;

namespace ShivaDigital_API.Data;

public class AuthRepository
{
    private readonly string _connectionString;

    public AuthRepository(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' was not found.");
    }

    public async Task<AuthResult> ValidateCredentialsAsync(string userName, string password)
    {
        await using var connection = new SqlConnection(_connectionString);
        await connection.OpenAsync();

        await using var command = new SqlCommand(@"
            SELECT TOP 1 ID, UserName, U_Password, U_role, IsActive
            FROM dbo.vvtblUsers
            WHERE UserName = @UserName AND U_Password = @Password AND IsActive = 1", connection);

        command.Parameters.Add("@UserName", SqlDbType.VarChar, 30).Value = userName ?? string.Empty;
        command.Parameters.Add("@Password", SqlDbType.VarChar, 30).Value = password ?? string.Empty;

        await using var reader = await command.ExecuteReaderAsync();
        if (!await reader.ReadAsync())
        {
            return new AuthResult { IsValid = false };
        }

        return new AuthResult
        {
            IsValid = true,
            UserName = reader.IsDBNull(reader.GetOrdinal("UserName")) ? null : reader.GetString(reader.GetOrdinal("UserName")),
            Role = reader.IsDBNull(reader.GetOrdinal("U_role")) ? null : reader.GetInt32(reader.GetOrdinal("U_role")),
            IsActive = reader.IsDBNull(reader.GetOrdinal("IsActive")) ? null : reader.GetBoolean(reader.GetOrdinal("IsActive"))
        };
    }
}
