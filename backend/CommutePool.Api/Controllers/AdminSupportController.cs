using CommutePool.Modules.SupportGrievance.Commands;
using CommutePool.Modules.SupportGrievance.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/admin/support")]
[Authorize]
public sealed class AdminSupportController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("tickets")]
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null)
    {
        var result = await mediator.Send(new GetAllTicketsAdminQuery(page, pageSize, status));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost("tickets/{ticketId}/assign")]
    public async Task<IActionResult> Assign(Guid ticketId)
    {
        var result = await mediator.Send(new AssignTicketCommand(UserId, ticketId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("tickets/{ticketId}/messages")]
    public async Task<IActionResult> AddMessage(Guid ticketId, [FromBody] AddAdminMessageRequest body)
    {
        var result = await mediator.Send(new AddTicketMessageCommand(UserId, ticketId, body.Message));
        return result.IsSuccess ? Ok(new { messageId = result.Value }) : BadRequest(result.Error);
    }

    [HttpPost("tickets/{ticketId}/resolve")]
    public async Task<IActionResult> Resolve(Guid ticketId, [FromBody] ResolveTicketRequest body)
    {
        var result = await mediator.Send(new ResolveTicketCommand(UserId, ticketId, body.Resolution));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record AddAdminMessageRequest(string Message);
    public sealed record ResolveTicketRequest(string Resolution);
}
