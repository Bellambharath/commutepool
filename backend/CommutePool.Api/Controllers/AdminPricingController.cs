using CommutePool.Modules.PricingPolicy.Commands;
using CommutePool.Modules.PricingPolicy.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/admin/pricing")]
[Authorize]
public sealed class AdminPricingController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("{corridorSlug}")]
    public async Task<IActionResult> Get(string corridorSlug)
    {
        var result = await mediator.Send(new GetPricingPolicyQuery(corridorSlug));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPut("{corridorSlug}")]
    public async Task<IActionResult> Upsert(string corridorSlug, [FromBody] UpsertPricingRequest body)
    {
        var result = await mediator.Send(new UpsertPricingPolicyCommand(
            UserId,
            corridorSlug,
            corridorSlug,
            body.MaxContributionPerKm,
            body.MaxDailyContribution,
            body.DetourPricePerMin,
            body.Active,
            body.EffectiveFrom));
        return result.IsSuccess ? Ok(new { policyId = result.Value }) : BadRequest(result.Error);
    }

    public sealed record UpsertPricingRequest(
        decimal MaxContributionPerKm,
        decimal MaxDailyContribution,
        decimal DetourPricePerMin,
        bool Active,
        DateOnly EffectiveFrom);
}
