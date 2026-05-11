using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Commute.Commands;

public sealed record UpsertCommuteProfileCommand(
    Guid UserId,
    Guid CorridorId,
    string HomeArea,
    double HomeLat,
    double HomeLng,
    string OfficeArea,
    double OfficeLat,
    double OfficeLng,
    TimeOnly MorningDepartureTime,
    TimeOnly EveningDepartureTime,
    List<string> ActiveDays   // e.g. ["MON","TUE","WED","THU","FRI"]
) : IRequest<Result<Guid>>;

public sealed record PauseCommuteProfileCommand(Guid UserId) : IRequest<Result>;
public sealed record ResumeCommuteProfileCommand(Guid UserId) : IRequest<Result>;
