using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Vehicle.Commands;

public sealed record RegisterVehicleCommand(
    Guid UserId,
    string RegistrationNo,
    string? Make,
    string? Model) : IRequest<Result<Guid>>;

public sealed record ActivateVehicleCommand(
    Guid UserId,
    Guid VehicleId) : IRequest<Result>;

public sealed record DeactivateVehicleCommand(
    Guid UserId,
    Guid VehicleId) : IRequest<Result>;
