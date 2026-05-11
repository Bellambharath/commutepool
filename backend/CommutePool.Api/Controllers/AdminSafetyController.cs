using CommutePool.Modules.SafetyIncident.Commands;
using CommutePool.Modules.SafetyIncident.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/admin/safety")]
[Authorize]
public sealed class AdminSafetyController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("incidents")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null)
    {
        var result = await mediator.Send(new GetAllIncidentsAdminQuery(page, pageSize, status));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("incidents/{incidentId}/escalate")]
    public async Task<IActionResult> Escalate(Guid incidentId, [FromBody] EscalateRequest body)
    {
        var result = await mediator.Send(new EscalateIncidentCommand(UserId, incidentId, body.Note));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("incidents/{incidentId}/resolve")]
    public async Task<IActionResult> Resolve(Guid incidentId, [FromBody] ResolveRequest body)
    {
        var result = await mediator.Send(new ResolveIncidentCommand(UserId, incidentId, body.Resolution));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record EscalateRequest(string Note);
    public sealed record ResolveRequest(string Resolution);
}
