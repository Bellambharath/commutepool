using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Corridor.Queries;

public sealed record ListActiveCorrdiorsQuery : IRequest<Result<List<CorridorDto>>>;
public sealed record GetCorridorByIdQuery(Guid CorridorId) : IRequest<Result<CorridorDto>>;

public sealed record CorridorDto(
    Guid Id,
    string Name,
    string Slug,
    string City,
    double CenterLat,
    double CenterLng,
    double RadiusKm,
    bool Active);
