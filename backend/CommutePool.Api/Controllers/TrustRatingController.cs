using CommutePool.Modules.TrustRating.Commands;
using CommutePool.Modules.TrustRating.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/ratings")]
[Authorize]
public sealed class TrustRatingController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("mine")]
    public async Task<IActionResult> GetMyRatings([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyRatingsQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("users/{userId}/score")]
    public async Task<IActionResult> GetScore(Guid userId)
    {
        var result = await mediator.Send(new GetUserTrustScoreQuery(userId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Submit([FromBody] SubmitRatingRequest body)
    {
        var result = await mediator.Send(new SubmitRatingCommand(
            body.TripId, UserId, body.RatedUserId, body.Stars, body.Comment));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetMyRatings), new { }, new { ratingId = result.Value })
            : BadRequest(result.Error);
    }

    public sealed record SubmitRatingRequest(
        Guid TripId,
        Guid RatedUserId,
        int Stars,
        string? Comment);
}
