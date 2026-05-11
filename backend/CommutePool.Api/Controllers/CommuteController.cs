using CommutePool.Modules.Commute.Commands;
using CommutePool.Modules.Commute.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/commute")]
[Authorize]
public sealed class CommuteController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var result = await mediator.Send(new GetMyCommuteProfileQuery(UserId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpsertProfile([FromBody] UpsertCommuteProfileCommand cmd)
    {
        var result = await mediator.Send(cmd with { UserId = UserId });
        return result.IsSuccess ? Ok(new { profileId = result.Value }) : BadRequest(result.Error);
    }

    [HttpPost("profile/pause")]
    public async Task<IActionResult> Pause()
    {
        var result = await mediator.Send(new PauseCommuteProfileCommand(UserId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("profile/resume")]
    public async Task<IActionResult> Resume()
    {
        var result = await mediator.Send(new ResumeCommuteProfileCommand(UserId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
