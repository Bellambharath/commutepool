using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.SafetyIncident.Queries;

public sealed record GetMyIncidentsQuery(Guid UserId, int Page, int PageSize) : IRequest<Result<List<IncidentDto>>>;
public sealed record GetIncidentDetailQuery(Guid IncidentId, Guid RequestingUserId) : IRequest<Result<IncidentDto>>;
public sealed record GetAllIncidentsAdminQuery(int Page, int PageSize, string? Status) : IRequest<Result<List<IncidentDto>>>;

public sealed record IncidentDto(
    Guid Id,
    Guid ReportedByUserId,
    string ReporterName,
    Guid? TripId,
    string IncidentType,
    string Status,
    string Description,
    string? EscalationNote,
    string? Resolution,
    bool IsSos,
    double? Lat,
    double? Lng,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ResolvedAt);
