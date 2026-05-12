using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Notification.Commands;
using CommutePool.Modules.Notification.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Notification.Handlers;

public sealed class SendInAppNotificationHandler(
    CommutePoolDbContext db) : IRequestHandler<SendInAppNotificationCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(SendInAppNotificationCommand req, CancellationToken ct)
    {
        var notification = new NotificationEntity
        {
            Id = Guid.NewGuid(),
            UserId = req.UserId,
            NotificationType = req.Category.ToString(),
            Title = req.Title,
            Body = req.Body,
            DeepLink = req.DeepLink,
            Read = false,
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.Notifications.Add(notification);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(notification.Id);
    }
}

public sealed class SendPushNotificationHandler(
    CommutePoolDbContext db) : IRequestHandler<SendPushNotificationCommand, Result>
{
    public async Task<Result> Handle(SendPushNotificationCommand req, CancellationToken ct)
    {
        // Store outbox event for push relay worker
        db.OutboxEvents.Add(new OutboxEventEntity
        {
            Id = Guid.NewGuid(),
            EventType = "PUSH_NOTIFICATION",
            AggregateType = "Notification",
            AggregateId = req.UserId,
            Payload = System.Text.Json.JsonSerializer.Serialize(new
            {
                req.UserId,
                req.Title,
                req.Body,
                req.Category,
                req.DeepLink,
                req.Data
            }),
            Status = "PENDING",
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class MarkNotificationReadHandler(
    CommutePoolDbContext db) : IRequestHandler<MarkNotificationReadCommand, Result>
{
    public async Task<Result> Handle(MarkNotificationReadCommand req, CancellationToken ct)
    {
        var n = await db.Notifications
            .FirstOrDefaultAsync(x => x.Id == req.NotificationId && x.UserId == req.UserId, ct);
        if (n is null) return Result.Fail("NOT_FOUND", "Notification not found.");
        n.Read = true;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class MarkAllNotificationsReadHandler(
    CommutePoolDbContext db) : IRequestHandler<MarkAllNotificationsReadCommand, Result>
{
    public async Task<Result> Handle(MarkAllNotificationsReadCommand req, CancellationToken ct)
    {
        await db.Notifications
            .Where(n => n.UserId == req.UserId && !n.Read)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.Read, true), ct);
        return Result.Ok();
    }
}

public sealed class GetMyNotificationsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyNotificationsQuery, Result<List<NotificationDto>>>
{
    public async Task<Result<List<NotificationDto>>> Handle(GetMyNotificationsQuery req, CancellationToken ct)
    {
        var query = db.Notifications.Where(n => n.UserId == req.UserId);
        if (req.UnreadOnly) query = query.Where(n => !n.Read);

        var list = await query
            .OrderByDescending(n => n.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(n => new NotificationDto(n.Id, n.Title, n.Body,
                n.NotificationType, n.DeepLink, n.Read, n.CreatedAt))
            .ToListAsync(ct);

        return Result<List<NotificationDto>>.Ok(list);
    }
}

public sealed class GetUnreadCountHandler(
    CommutePoolDbContext db) : IRequestHandler<GetUnreadCountQuery, Result<int>>
{
    public async Task<Result<int>> Handle(GetUnreadCountQuery req, CancellationToken ct)
    {
        var count = await db.Notifications
            .CountAsync(n => n.UserId == req.UserId && !n.Read, ct);
        return Result<int>.Ok(count);
    }
}
