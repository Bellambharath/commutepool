using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Request.Queries;

public sealed record GetMyRideRequestsQuery(
    Guid RiderId,
    int Page,
    int PageSize) : IRequest<Result<List<RideRequestDto>>>;

public sealed record GetRequestsForOfferQuery(
    Guid OwnerId,
    Guid OfferId) : IRequest<Result<List<RideRequestDto>>>;

public sealed record RideRequestDto(
    Guid Id,
    Guid OfferId,
    Guid RiderId,
    string RiderName,
    string Status,
    string? Note,
    string? DeclineReason,
    DateTimeOffset CreatedAt);
