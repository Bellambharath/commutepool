using CommutePool.Modules.SupportGrievance.Commands;
using CommutePool.Modules.SupportGrievance.Queries;
using CommutePool.Shared.Enums;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/support")]
[Authorize]
public sealed class SupportController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet("tickets")]
    public async Task<IActionResult> GetMyTickets([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await mediator.Send(new GetMyTicketsQuery(UserId, page, pageSize));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("tickets/{ticketId}")]
    public async Task<IActionResult> GetDetail(Guid ticketId)
    {
        var result = await mediator.Send(new GetTicketDetailQuery(ticketId, UserId));
        return result.IsSuccess ? Ok(result.Value) : NotFound(result.Error);
    }

    [HttpPost("tickets")]
    public async Task<IActionResult> Raise([FromBody] RaiseTicketRequest body)
    {
        var result = await mediator.Send(new RaiseTicketCommand(
            UserId, body.Category, body.Subject, body.Body, body.TripId));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetDetail), new { ticketId = result.Value }, new { ticketId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpPost("tickets/{ticketId}/messages")]
    public async Task<IActionResult> AddMessage(Guid ticketId, [FromBody] AddMessageRequest body)
    {
        var result = await mediator.Send(new AddTicketMessageCommand(UserId, ticketId, body.Message));
        return result.IsSuccess ? Ok(new { messageId = result.Value }) : BadRequest(result.Error);
    }

    [HttpPost("tickets/{ticketId}/close")]
    public async Task<IActionResult> Close(Guid ticketId)
    {
        var result = await mediator.Send(new CloseTicketCommand(UserId, ticketId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record RaiseTicketRequest(TicketCategory Category, string Subject, string Body, Guid? TripId);
    public sealed record AddMessageRequest(string Message);
}
