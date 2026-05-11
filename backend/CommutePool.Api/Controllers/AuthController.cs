using CommutePool.Modules.Identity.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IMediator mediator) : ControllerBase
{
    /// <summary>Request OTP — sends a 6-digit OTP to the given phone number.</summary>
    [HttpPost("otp/request")]
    public async Task<IActionResult> RequestOtp([FromBody] RequestOtpCommand command)
    {
        var result = await mediator.Send(command);
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    /// <summary>Verify OTP — exchanges OTP for access + refresh tokens.</summary>
    [HttpPost("otp/verify")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyOtpCommand command)
    {
        var result = await mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    /// <summary>Refresh — exchanges refresh token for new access token.</summary>
    [HttpPost("token/refresh")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenCommand command)
    {
        var result = await mediator.Send(command);
        return result.IsSuccess ? Ok(result.Value) : Unauthorized(result.Error);
    }

    /// <summary>Logout — revokes the current session.</summary>
    [HttpPost("logout")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Logout([FromBody] LogoutCommand command)
    {
        var result = await mediator.Send(command);
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
