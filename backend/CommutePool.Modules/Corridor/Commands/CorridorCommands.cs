using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Corridor.Commands;

public sealed record CreateCorridorCommand(
    string Name,
    string Slug,
    string City,
    double CenterLat,
    double CenterLng,
    double RadiusKm) : IRequest<Result<Guid>>;

public sealed record DeactivateCorridorCommand(Guid CorridorId) : IRequest<Result>;
