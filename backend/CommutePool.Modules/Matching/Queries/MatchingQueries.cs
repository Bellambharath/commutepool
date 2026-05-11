using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Matching.Queries;

public sealed record GetMyMatchesQuery(
    Guid UserId,
    int Page,
    int PageSize) : IRequest<Result<List<MatchDto>>>;

public sealed record GetMatchDetailQuery(Guid MatchId) : IRequest<Result<MatchDto>>;

public sealed record MatchDto(
    Guid Id,
    Guid OfferId,
    Guid RideRequestId,
    Guid OwnerId,
    string OwnerName,
    Guid RiderId,
    string RiderName,
    int Score,
    string Status,
    Guid? PickupOptionId,
    DateTimeOffset CreatedAt);
