using Microsoft.AspNetCore.Mvc;
using ShivaDigital_API.Data;
using ShivaDigital_API.Models;

namespace ShivaDigital_API.Controllers;

[ApiController]
[Route("[controller]")]
public class AuthController : ControllerBase
{
    private readonly AuthRepository _repository;

    public AuthController(AuthRepository repository)
    {
        _repository = repository;
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResult>> Login([FromBody] UserLogin request)
    {
        if (string.IsNullOrWhiteSpace(request.UserName) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new AuthResult { IsValid = false });
        }

        var result = await _repository.ValidateCredentialsAsync(request.UserName, request.Password);
        return Ok(result);
    }
}
