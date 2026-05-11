using CommutePool.Modules.Trip.Commands;
using CommutePool.Modules.Trip.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/trips")]
[Authorize]
public sealed class TripController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMyTrips([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyTripsQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{tripId}")]
    public async Task<IActionResult> GetDetail(Guid tripId)
    {
        var result = await mediator.Send(new GetTripDetailQuery(tripId, UserId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("start")]
    public async Task<IActionResult> Start([FromBody] StartTripRequest body)
    {
        var result = await mediator.Send(new StartTripCommand(body.MatchId, UserId));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { tripId = result.Value }, new { tripId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpPost("{tripId}/complete")]
    public async Task<IActionResult> Complete(Guid tripId)
    {
        var result = await mediator.Send(new CompleteTripCommand(tripId, UserId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{tripId}/cancel")]
    public async Task<IActionResult> Cancel(Guid tripId, [FromBody] CancelTripRequest body)
    {
        var result = await mediator.Send(new CancelTripCommand(tripId, UserId, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{tripId}/no-show")]
    public async Task<IActionResult> NoShow(Guid tripId)
    {
        var result = await mediator.Send(new MarkNoShowCommand(tripId, UserId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record StartTripRequest(Guid MatchId);
    public sealed record CancelTripRequest(string Reason);
}
