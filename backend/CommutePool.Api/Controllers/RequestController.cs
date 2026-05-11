using CommutePool.Modules.Request.Commands;
using CommutePool.Modules.Request.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/requests")]
[Authorize]
public sealed class RequestController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("mine")]
    public async Task<IActionResult> GetMine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyRideRequestsQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("for-offer/{offerId}")]
    public async Task<IActionResult> GetForOffer(Guid offerId)
    {
        var result = await mediator.Send(new GetRequestsForOfferQuery(UserId, offerId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Send([FromBody] SendRideRequestCommand cmd)
    {
        var result = await mediator.Send(cmd with { RiderId = UserId });
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetMine), new { }, new { requestId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpPost("{requestId}/withdraw")]
    public async Task<IActionResult> Withdraw(Guid requestId)
    {
        var result = await mediator.Send(new WithdrawRideRequestCommand(UserId, requestId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{requestId}/accept")]
    public async Task<IActionResult> Accept(Guid requestId)
    {
        var result = await mediator.Send(new AcceptRideRequestCommand(UserId, requestId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{requestId}/decline")]
    public async Task<IActionResult> Decline(Guid requestId, [FromBody] DeclineRequest body)
    {
        var result = await mediator.Send(new DeclineRideRequestCommand(UserId, requestId, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record DeclineRequest(string Reason);
}
