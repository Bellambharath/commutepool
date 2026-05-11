using CommutePool.Modules.Offer.Commands;
using CommutePool.Modules.Offer.Queries;
using CommutePool.Shared.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/offers")]
[Authorize]
public sealed class OfferController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyOffers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyOffersQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{offerId}")]
    public async Task<IActionResult> GetDetail(Guid offerId)
    {
        var result = await mediator.Send(new GetOfferDetailQuery(offerId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailable(
        [FromQuery] Guid corridorId,
        [FromQuery] DateOnly date)
    {
        var result = await mediator.Send(new GetAvailableOffersForRiderQuery(UserId, corridorId, date));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateOfferCommand cmd)
    {
        var result = await mediator.Send(cmd with { OwnerId = UserId });
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { offerId = result.Value }, new { offerId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpPost("{offerId}/cancel")]
    public async Task<IActionResult> Cancel(Guid offerId, [FromBody] CancelOfferRequest body)
    {
        var result = await mediator.Send(new CancelOfferCommand(UserId, offerId, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record CancelOfferRequest(string Reason);
}
