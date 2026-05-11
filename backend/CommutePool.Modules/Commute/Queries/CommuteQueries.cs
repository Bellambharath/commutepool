using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Commute.Queries;

public sealed record GetMyCommuteProfileQuery(Guid UserId) : IRequest<Result<CommuteProfileDto?>>;

public sealed record CommuteProfileDto(
    Guid Id,
    Guid CorridorId,
    string CorridorName,
    string HomeArea,
    double HomeLat,
    double HomeLng,
    string OfficeArea,
    double OfficeLat,
    double OfficeLng,
    string MorningDepartureTime,
    string EveningDepartureTime,
    List<string> ActiveDays,
    bool Paused);
