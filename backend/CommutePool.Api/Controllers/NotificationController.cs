using CommutePool.Modules.Notification.Commands;
using CommutePool.Modules.Notification.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/notifications")]
[Authorize]
public sealed class NotificationController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMine(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool unreadOnly = false)
    {
        var result = await mediator.Send(new GetMyNotificationsQuery(UserId, page, pageSize, unreadOnly));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> UnreadCount()
    {
        var result = await mediator.Send(new GetUnreadCountQuery(UserId));
        return result.IsSuccess ? Ok(new { count = result.Value }) : BadRequest(result.Error);
    }

    [HttpPost("{notificationId}/read")]
    public async Task<IActionResult> MarkRead(Guid notificationId)
    {
        var result = await mediator.Send(new MarkNotificationReadCommand(UserId, notificationId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllRead()
    {
        var result = await mediator.Send(new MarkAllNotificationsReadCommand(UserId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }
}
