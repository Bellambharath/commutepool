using CommutePool.Modules.Corridor.Commands;
using CommutePool.Modules.Corridor.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/corridors")]
public sealed class CorridorController(IMediator mediator) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> List()
    {
        var result = await mediator.Send(new ListActiveCorrdiorsQuery());
        return result.IsSuccess ? Ok(result.Value) : StatusCode(500, result.Error);
    }

    [HttpGet("{corridorId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(Guid corridorId)
    {
        var result = await mediator.Send(new GetCorridorByIdQuery(corridorId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateCorridorCommand cmd)
    {
        var result = await mediator.Send(cmd);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { corridorId = result.Value }, new { corridorId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpPost("{corridorId}/deactivate")]
    [Authorize]
    public async Task<IActionResult> Deactivate(Guid corridorId)
    {
        var result = await mediator.Send(new DeactivateCorridorCommand(corridorId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
