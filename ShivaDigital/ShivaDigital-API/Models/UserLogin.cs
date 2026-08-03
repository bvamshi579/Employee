namespace ShivaDigital_API.Models;

public class UserLogin
{
    public string? UserName { get; set; }
    public string? Password { get; set; }
}

public class AuthResult
{
    public bool IsValid { get; set; }
    public string? UserName { get; set; }
    public int? Role { get; set; }
    public bool? IsActive { get; set; }
}
