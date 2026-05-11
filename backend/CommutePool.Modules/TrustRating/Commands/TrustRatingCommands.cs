using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.TrustRating.Commands;

public sealed record SubmitRatingCommand(
    Guid TripId,
    Guid RaterUserId,
    Guid RatedUserId,
    int Stars,           // 1-5
    string? Comment) : IRequest<Result<Guid>>;

public sealed record RecomputeTrustScoreCommand(
    Guid UserId) : IRequest<Result<double>>;
