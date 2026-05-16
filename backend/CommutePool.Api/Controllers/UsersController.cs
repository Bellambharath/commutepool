using CommutePool.Modules.UserProfile.Commands;
using CommutePool.Modules.UserProfile.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public sealed class UsersController(IMediator mediator) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var result = await mediator.Send(new GetMyProfileQuery(UserId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPut("me")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileCommand command)
    {
        var result = await mediator.Send(command with { UserId = UserId });
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPut("me/emergency-contact")]
    public async Task<IActionResult> UpdateEmergencyContact([FromBody] UpdateEmergencyContactCommand command)
    {
        var result = await mediator.Send(command with { UserId = UserId });
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    private Guid UserId =>
        Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
}
