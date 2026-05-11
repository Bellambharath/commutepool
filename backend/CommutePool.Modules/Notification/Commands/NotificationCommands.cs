using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Notification.Commands;

public sealed record SendPushNotificationCommand(
    Guid UserId,
    string Title,
    string Body,
    NotificationCategory Category,
    string? DeepLink,
    Dictionary<string, string>? Data) : IRequest<Result>;

public sealed record SendInAppNotificationCommand(
    Guid UserId,
    string Title,
    string Body,
    NotificationCategory Category,
    string? DeepLink) : IRequest<Result<Guid>>;

public sealed record MarkNotificationReadCommand(
    Guid UserId,
    Guid NotificationId) : IRequest<Result>;

public sealed record MarkAllNotificationsReadCommand(
    Guid UserId) : IRequest<Result>;
