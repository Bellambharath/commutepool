using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Matching.Commands;

public sealed record GenerateMatchCommand(
    Guid RideRequestId,
    Guid OfferId,
    Guid RiderId,
    Guid OwnerId) : IRequest<Result<Guid>>;

public sealed record ConfirmMatchCommand(
    Guid MatchId) : IRequest<Result>;

public sealed record ExpireMatchCommand(
    Guid MatchId) : IRequest<Result>;
