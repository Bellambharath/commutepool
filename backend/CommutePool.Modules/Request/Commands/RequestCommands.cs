using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Request.Commands;

public sealed record SendRideRequestCommand(
    Guid RiderId,
    Guid CommuteProfileId,
    string? PickupModePref) : IRequest<Result<Guid>>;

public sealed record PauseRideRequestCommand(
    Guid RequestId,
    Guid RiderId) : IRequest<Result>;

public sealed record ResumeRideRequestCommand(
    Guid RequestId,
    Guid RiderId) : IRequest<Result>;

public sealed record CloseRideRequestCommand(
    Guid RequestId,
    Guid RiderId) : IRequest<Result>;
