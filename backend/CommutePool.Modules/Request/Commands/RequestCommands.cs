using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Request.Commands;

public sealed record SendRideRequestCommand(
    Guid RiderId,
    Guid OfferId,
    string? Note) : IRequest<Result<Guid>>;

public sealed record WithdrawRideRequestCommand(
    Guid RiderId,
    Guid RequestId) : IRequest<Result>;

public sealed record AcceptRideRequestCommand(
    Guid OwnerId,
    Guid RequestId) : IRequest<Result>;

public sealed record DeclineRideRequestCommand(
    Guid OwnerId,
    Guid RequestId,
    string Reason) : IRequest<Result>;
