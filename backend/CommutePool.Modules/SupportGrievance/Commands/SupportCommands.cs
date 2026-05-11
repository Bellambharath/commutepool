using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.SupportGrievance.Commands;

public sealed record RaiseTicketCommand(
    Guid UserId,
    TicketCategory Category,
    string Subject,
    string Body,
    Guid? TripId) : IRequest<Result<Guid>>;

public sealed record AddTicketMessageCommand(
    Guid UserId,
    Guid TicketId,
    string Message) : IRequest<Result<Guid>>;

public sealed record CloseTicketCommand(
    Guid UserId,
    Guid TicketId) : IRequest<Result>;

public sealed record AssignTicketCommand(
    Guid AdminUserId,
    Guid TicketId) : IRequest<Result>;

public sealed record ResolveTicketCommand(
    Guid AdminUserId,
    Guid TicketId,
    string Resolution) : IRequest<Result>;
