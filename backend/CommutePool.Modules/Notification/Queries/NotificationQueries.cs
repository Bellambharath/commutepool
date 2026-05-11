using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Notification.Queries;

public sealed record GetMyNotificationsQuery(
    Guid UserId,
    int Page,
    int PageSize,
    bool UnreadOnly) : IRequest<Result<List<NotificationDto>>>;

public sealed record GetUnreadCountQuery(Guid UserId) : IRequest<Result<int>>;

public sealed record NotificationDto(
    Guid Id,
    string Title,
    string Body,
    string Category,
    string? DeepLink,
    bool Read,
    DateTimeOffset CreatedAt);
