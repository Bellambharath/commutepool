using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.SafetyIncident.Queries;

public sealed record GetMyIncidentsQuery(
    Guid UserId,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<List<IncidentDto>>>;

public sealed record GetIncidentDetailQuery(
    Guid IncidentId,
    Guid RequestingUserId) : IRequest<Result<IncidentDto>>;

public sealed record GetAllIncidentsAdminQuery(
    string? Status,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<List<IncidentDto>>>;

public sealed record IncidentDto(
    Guid Id,
    Guid ReporterId,
    Guid? TripId,
    string IncidentType,
    string Status,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ResolvedAt);
