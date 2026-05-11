using CommutePool.Modules.Company.Commands;
using CommutePool.Modules.Company.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/company")]
[Authorize]
public sealed class CompanyController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpPost("verify-email")]
    public async Task<IActionResult> InitiateEmailVerification([FromBody] InitiateEmailRequest body)
    {
        var result = await mediator.Send(new InitiateOfficeEmailVerificationCommand(UserId, body.WorkEmail));
        return result.IsSuccess ? Ok() : BadRequest(result.Error);
    }

    [HttpGet("membership")]
    public async Task<IActionResult> GetMembership()
    {
        var result = await mediator.Send(new GetUserCompanyMembershipQuery(UserId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    public sealed record InitiateEmailRequest(string WorkEmail);
}
