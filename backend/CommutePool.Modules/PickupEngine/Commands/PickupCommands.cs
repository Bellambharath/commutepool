using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.PickupEngine.Commands;

public sealed record GeneratePickupOptionsCommand(
    Guid MatchId) : IRequest<Result<List<PickupOptionDto>>>;

public sealed record SelectPickupOptionCommand(
    Guid MatchId,
    Guid PickupOptionId,
    Guid SelectedByUserId) : IRequest<Result>;

public sealed record PickupOptionDto(
    Guid Id,
    Guid MatchId,
    string Label,
    double Lat,
    double Lng,
    string GeneratedBy,   // "MIDPOINT" | "PROXIMITY" | "MANUAL"
    bool Selected);
