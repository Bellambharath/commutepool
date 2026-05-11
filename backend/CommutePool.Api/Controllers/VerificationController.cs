using CommutePool.Modules.Verification.Commands;
using CommutePool.Modules.Verification.Queries;
using CommutePool.Shared.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/verification")]
[Authorize]
public sealed class VerificationController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    /// <summary>Get current user's verification status and document list.</summary>
    [HttpGet("status")]
    public async Task<IActionResult> GetStatus()
    {
        var result = await mediator.Send(new GetVerificationStatusQuery(UserId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    /// <summary>Submit a document for verification (DL, RC, Selfie).</summary>
    [HttpPost("submit")]
    public async Task<IActionResult> Submit([FromBody] SubmitDocumentRequest body)
    {
        var result = await mediator.Send(new SubmitVerificationDocumentCommand(
            UserId, body.DocumentType, body.ArtifactUrl));
        return result.IsSuccess ? Ok(new { caseId = result.Value }) : BadRequest(result.Error);
    }

    public sealed record SubmitDocumentRequest(
        VerificationDocumentType DocumentType,
        string ArtifactUrl);
}
