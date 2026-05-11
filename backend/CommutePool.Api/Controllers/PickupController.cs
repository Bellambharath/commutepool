using CommutePool.Modules.PickupEngine.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/matches/{matchId}/pickup")]
[Authorize]
public sealed class PickupController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("generate")]
    public async Task<IActionResult> Generate(Guid matchId)
    {
        var result = await mediator.Send(new GeneratePickupOptionsCommand(matchId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("select")]
    public async Task<IActionResult> Select(Guid matchId, [FromBody] SelectPickupRequest body)
    {
        var result = await mediator.Send(new SelectPickupOptionCommand(matchId, body.PickupOptionId, UserId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record SelectPickupRequest(Guid PickupOptionId);
}
