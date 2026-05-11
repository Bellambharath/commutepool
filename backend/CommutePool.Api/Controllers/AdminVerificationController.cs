using CommutePool.Modules.Verification.Commands;
using CommutePool.Modules.Verification.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

/// <summary>
/// Admin-only verification review endpoints.
/// In v1 role check is done by checking AdminRole claim.
/// TODO: Replace with proper role-based policy.
/// </summary>
[ApiController]
[Route("api/admin/verification")]
[Authorize]
public sealed class AdminVerificationController(IMediator mediator) : ControllerBase
{
    private Guid ReviewerId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetPendingVerificationsQuery(page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("{caseId}")]
    public async Task<IActionResult> GetDetail(Guid caseId)
    {
        var result = await mediator.Send(new GetVerificationCaseDetailQuery(caseId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("{caseId}/approve")]
    public async Task<IActionResult> Approve(Guid caseId)
    {
        var result = await mediator.Send(new ApproveVerificationCommand(ReviewerId, caseId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{caseId}/reject")]
    public async Task<IActionResult> Reject(Guid caseId, [FromBody] RejectRequest body)
    {
        var result = await mediator.Send(new RejectVerificationCommand(ReviewerId, caseId, body.Reason));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record RejectRequest(string Reason);
}
