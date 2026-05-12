using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.SafetyIncident.Commands;
using CommutePool.Modules.SafetyIncident.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.SafetyIncident.Handlers;

public sealed class RaiseSosHandler(
    CommutePoolDbContext db) : IRequestHandler<RaiseSosCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(RaiseSosCommand req, CancellationToken ct)
    {
        var incident = new IncidentEntity
        {
            Id = Guid.NewGuid(),
            ReporterId = req.UserId,
            TripId = req.TripId,
            IncidentType = IncidentType.Sos,
            Severity = IncidentSeverity.Critical,
            Status = IncidentStatus.Open,
            Description = req.Note ?? "SOS raised.",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.Incidents.Add(incident);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(incident.Id);
    }
}

public sealed class ReportIncidentHandler(
    CommutePoolDbContext db) : IRequestHandler<ReportIncidentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(ReportIncidentCommand req, CancellationToken ct)
    {
        var incident = new IncidentEntity
        {
            Id = Guid.NewGuid(),
            ReporterId = req.ReportedByUserId,
            TripId = req.TripId,
            IncidentType = req.IncidentType,
            Severity = IncidentSeverity.Medium,
            Status = IncidentStatus.Open,
            Description = req.Description,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.Incidents.Add(incident);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(incident.Id);
    }
}

public sealed class EscalateIncidentHandler(
    CommutePoolDbContext db) : IRequestHandler<EscalateIncidentCommand, Result>
{
    public async Task<Result> Handle(EscalateIncidentCommand req, CancellationToken ct)
    {
        var incident = await db.Incidents.FindAsync([req.IncidentId], ct);
        if (incident is null) return Result.Fail("NOT_FOUND", "Incident not found.");
        if (incident.Status == IncidentStatus.Resolved)
            return Result.Fail("ALREADY_RESOLVED", "Incident is already resolved.");

        incident.Status = IncidentStatus.Escalated;
        incident.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class ResolveIncidentHandler(
    CommutePoolDbContext db) : IRequestHandler<ResolveIncidentCommand, Result>
{
    public async Task<Result> Handle(ResolveIncidentCommand req, CancellationToken ct)
    {
        var incident = await db.Incidents.FindAsync([req.IncidentId], ct);
        if (incident is null) return Result.Fail("NOT_FOUND", "Incident not found.");

        incident.Status = IncidentStatus.Resolved;
        incident.ResolutionNote = req.Resolution;
        incident.ResolvedAt = DateTimeOffset.UtcNow;
        incident.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyIncidentsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyIncidentsQuery, Result<List<IncidentDto>>>
{
    public async Task<Result<List<IncidentDto>>> Handle(GetMyIncidentsQuery req, CancellationToken ct)
    {
        var list = await db.Incidents
            .Where(i => i.ReporterId == req.UserId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(i => new IncidentDto(
                i.Id, i.ReporterId, i.TripId,
                i.IncidentType.ToString(), i.Status.ToString(),
                i.Description, i.CreatedAt, i.ResolvedAt))
            .ToListAsync(ct);
        return Result<List<IncidentDto>>.Ok(list);
    }
}

public sealed class GetIncidentDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetIncidentDetailQuery, Result<IncidentDto>>
{
    public async Task<Result<IncidentDto>> Handle(GetIncidentDetailQuery req, CancellationToken ct)
    {
        var i = await db.Incidents
            .FirstOrDefaultAsync(x => x.Id == req.IncidentId, ct);
        if (i is null) return Result<IncidentDto>.Fail("NOT_FOUND", "Incident not found.");
        if (i.ReporterId != req.RequestingUserId)
            return Result<IncidentDto>.Fail("FORBIDDEN", "Not your incident.");
        return Result<IncidentDto>.Ok(new IncidentDto(
            i.Id, i.ReporterId, i.TripId,
            i.IncidentType.ToString(), i.Status.ToString(),
            i.Description, i.CreatedAt, i.ResolvedAt));
    }
}

public sealed class GetAllIncidentsAdminHandler(
    CommutePoolDbContext db) : IRequestHandler<GetAllIncidentsAdminQuery, Result<List<IncidentDto>>>
{
    public async Task<Result<List<IncidentDto>>> Handle(GetAllIncidentsAdminQuery req, CancellationToken ct)
    {
        var query = db.Incidents.AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Status) &&
            Enum.TryParse<IncidentStatus>(req.Status, true, out var statusFilter))
            query = query.Where(i => i.Status == statusFilter);

        var list = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(i => new IncidentDto(
                i.Id, i.ReporterId, i.TripId,
                i.IncidentType.ToString(), i.Status.ToString(),
                i.Description, i.CreatedAt, i.ResolvedAt))
            .ToListAsync(ct);

        return Result<List<IncidentDto>>.Ok(list);
    }
}
