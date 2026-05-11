using CommutePool.Modules.Analytics.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/admin/analytics")]
[Authorize]
public sealed class AdminAnalyticsController(IMediator mediator) : ControllerBase
{
    [HttpGet("trips")]
    public async Task<IActionResult> TripMetrics([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        var result = await mediator.Send(new GetTripMetricsQuery(from, to));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("funnel")]
    public async Task<IActionResult> FunnelMetrics([FromQuery] DateOnly from, [FromQuery] DateOnly to)
    {
        var result = await mediator.Send(new GetFunnelMetricsQuery(from, to));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }
}
