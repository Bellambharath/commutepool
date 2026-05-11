using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Vehicle.Queries;

public sealed record GetMyVehiclesQuery(Guid UserId) : IRequest<Result<List<VehicleDto>>>;

public sealed record VehicleDto(
    Guid Id,
    string RegistrationNo,
    string? Make,
    string? Model,
    bool Active,
    DateTimeOffset CreatedAt);
