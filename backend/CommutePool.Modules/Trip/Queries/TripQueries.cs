using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Trip.Queries;

public sealed record GetMyTripsQuery(
    Guid UserId,
    int Page,
    int PageSize) : IRequest<Result<List<TripDto>>>;

public sealed record GetTripDetailQuery(Guid TripId, Guid RequestingUserId) : IRequest<Result<TripDto>>;

public sealed record TripDto(
    Guid Id,
    Guid MatchId,
    Guid OwnerId,
    string OwnerName,
    Guid RiderId,
    string RiderName,
    string Status,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt,
    DateTimeOffset? CancelledAt,
    string? CancelReason,
    DateTimeOffset CreatedAt);
