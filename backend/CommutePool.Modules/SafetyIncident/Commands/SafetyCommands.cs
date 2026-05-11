using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.SafetyIncident.Commands;

public sealed record RaiseSosCommand(
    Guid UserId,
    Guid? TripId,
    double Lat,
    double Lng,
    string? Note) : IRequest<Result<Guid>>;

public sealed record ReportIncidentCommand(
    Guid ReportedByUserId,
    Guid? TripId,
    IncidentType IncidentType,
    string Description) : IRequest<Result<Guid>>;

public sealed record EscalateIncidentCommand(
    Guid AdminUserId,
    Guid IncidentId,
    string Note) : IRequest<Result>;

public sealed record ResolveIncidentCommand(
    Guid AdminUserId,
    Guid IncidentId,
    string Resolution) : IRequest<Result>;
