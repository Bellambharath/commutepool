using CommutePool.Modules.SafetyIncident.Commands;
using CommutePool.Modules.SafetyIncident.Queries;
using CommutePool.Shared.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/safety")]
[Authorize]
public sealed class SafetyController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("sos")]
    public async Task<IActionResult> RaiseSos([FromBody] SosRequest body)
    {
        var result = await mediator.Send(new RaiseSosCommand(UserId, body.TripId, body.Lat, body.Lng, body.Note));
        return result.IsSuccess ? Ok(new { incidentId = result.Value }) : BadRequest(result.Error);
    }

    [HttpPost("incidents")]
    public async Task<IActionResult> Report([FromBody] ReportIncidentRequest body)
    {
        var result = await mediator.Send(new ReportIncidentCommand(UserId, body.TripId, body.IncidentType, body.Description));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { incidentId = result.Value }, new { incidentId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpGet("incidents")]
    public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyIncidentsQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("incidents/{incidentId}")]
    public async Task<IActionResult> GetDetail(Guid incidentId)
    {
        var result = await mediator.Send(new GetIncidentDetailQuery(incidentId, UserId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    public sealed record SosRequest(Guid? TripId, double Lat, double Lng, string? Note);
    public sealed record ReportIncidentRequest(Guid? TripId, IncidentType IncidentType, string Description);
}
