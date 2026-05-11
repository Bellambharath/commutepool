using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.SupportGrievance.Queries;

public sealed record GetMyTicketsQuery(Guid UserId, int Page, int PageSize) : IRequest<Result<List<TicketDto>>>;
public sealed record GetTicketDetailQuery(Guid TicketId, Guid RequestingUserId) : IRequest<Result<TicketDetailDto>>;
public sealed record GetAllTicketsAdminQuery(int Page, int PageSize, string? Status) : IRequest<Result<List<TicketDto>>>;

public sealed record TicketDto(
    Guid Id,
    string Category,
    string Subject,
    string Status,
    Guid? AssignedAdminId,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record TicketDetailDto(
    Guid Id,
    Guid UserId,
    string Category,
    string Subject,
    string Status,
    string? Resolution,
    Guid? TripId,
    List<TicketMessageDto> Messages,
    DateTimeOffset CreatedAt);

public sealed record TicketMessageDto(
    Guid Id,
    Guid SentByUserId,
    string SenderName,
    string Message,
    DateTimeOffset CreatedAt);
