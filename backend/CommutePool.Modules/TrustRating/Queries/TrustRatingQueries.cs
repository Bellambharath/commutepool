using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.TrustRating.Queries;

public sealed record GetUserTrustScoreQuery(Guid UserId) : IRequest<Result<TrustScoreDto>>;
public sealed record GetMyRatingsQuery(Guid UserId, int Page, int PageSize) : IRequest<Result<List<RatingDto>>>;

public sealed record TrustScoreDto(
    Guid UserId,
    double Score,
    int TotalRatings,
    DateTimeOffset LastComputedAt);

public sealed record RatingDto(
    Guid Id,
    Guid TripId,
    Guid RaterUserId,
    string RaterName,
    int Stars,
    string? Comment,
    DateTimeOffset CreatedAt);
