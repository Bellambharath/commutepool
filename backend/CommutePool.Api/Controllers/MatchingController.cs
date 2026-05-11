using CommutePool.Modules.Matching.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/matches")]
[Authorize]
public sealed class MatchingController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMyMatches([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyMatchesQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{matchId}")]
    public async Task<IActionResult> GetDetail(Guid matchId)
    {
        var result = await mediator.Send(new GetMatchDetailQuery(matchId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }
}
