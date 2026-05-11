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
        var incident = new SafetyIncidentEntity
        {
            Id = Guid.NewGuid(),
            ReportedByUserId = req.UserId,
            TripId = req.TripId,
            IncidentType = IncidentType.Sos,
            Status = IncidentStatus.Open,
            Description = req.Note ?? "SOS raised.",
            IsSos = true,
            Lat = req.Lat,
            Lng = req.Lng,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.SafetyIncidents.Add(incident);
        await db.SaveChangesAsync(ct);
        // TODO: Push high-priority notification to ops team
        return Result<Guid>.Ok(incident.Id);
    }
}

public sealed class ReportIncidentHandler(
    CommutePoolDbContext db) : IRequestHandler<ReportIncidentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(ReportIncidentCommand req, CancellationToken ct)
    {
        var incident = new SafetyIncidentEntity
        {
            Id = Guid.NewGuid(),
            ReportedByUserId = req.ReportedByUserId,
            TripId = req.TripId,
            IncidentType = req.IncidentType,
            Status = IncidentStatus.Open,
            Description = req.Description,
            IsSos = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.SafetyIncidents.Add(incident);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(incident.Id);
    }
}

public sealed class EscalateIncidentHandler(
    CommutePoolDbContext db) : IRequestHandler<EscalateIncidentCommand, Result>
{
    public async Task<Result> Handle(EscalateIncidentCommand req, CancellationToken ct)
    {
        var incident = await db.SafetyIncidents.FindAsync([req.IncidentId], ct);
        if (incident is null) return Result.Fail("NOT_FOUND", "Incident not found.");
        if (incident.Status == IncidentStatus.Resolved)
            return Result.Fail("ALREADY_RESOLVED", "Incident is already resolved.");

        incident.Status = IncidentStatus.Escalated;
        incident.EscalationNote = req.Note;
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
        var incident = await db.SafetyIncidents.FindAsync([req.IncidentId], ct);
        if (incident is null) return Result.Fail("NOT_FOUND", "Incident not found.");

        incident.Status = IncidentStatus.Resolved;
        incident.Resolution = req.Resolution;
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
        var list = await db.SafetyIncidents
            .Include(i => i.ReportedBy)
            .Where(i => i.ReportedByUserId == req.UserId)
            .OrderByDescending(i => i.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(i => Map(i))
            .ToListAsync(ct);
        return Result<List<IncidentDto>>.Ok(list);
    }
    private static IncidentDto Map(SafetyIncidentEntity i) => new(
        i.Id, i.ReportedByUserId, i.ReportedBy.Name ?? string.Empty,
        i.TripId, i.IncidentType.ToString(), i.Status.ToString(),
        i.Description, i.EscalationNote, i.Resolution,
        i.IsSos, i.Lat, i.Lng, i.CreatedAt, i.ResolvedAt);
}

public sealed class GetIncidentDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetIncidentDetailQuery, Result<IncidentDto>>
{
    public async Task<Result<IncidentDto>> Handle(GetIncidentDetailQuery req, CancellationToken ct)
    {
        var i = await db.SafetyIncidents
            .Include(x => x.ReportedBy)
            .FirstOrDefaultAsync(x => x.Id == req.IncidentId, ct);
        if (i is null) return Result<IncidentDto>.Fail("NOT_FOUND", "Incident not found.");
        if (i.ReportedByUserId != req.RequestingUserId)
            return Result<IncidentDto>.Fail("FORBIDDEN", "Not your incident.");
        return Result<IncidentDto>.Ok(new IncidentDto(
            i.Id, i.ReportedByUserId, i.ReportedBy.Name ?? string.Empty,
            i.TripId, i.IncidentType.ToString(), i.Status.ToString(),
            i.Description, i.EscalationNote, i.Resolution,
            i.IsSos, i.Lat, i.Lng, i.CreatedAt, i.ResolvedAt));
    }
}

public sealed class GetAllIncidentsAdminHandler(
    CommutePoolDbContext db) : IRequestHandler<GetAllIncidentsAdminQuery, Result<List<IncidentDto>>>
{
    public async Task<Result<List<IncidentDto>>> Handle(GetAllIncidentsAdminQuery req, CancellationToken ct)
    {
        var query = db.SafetyIncidents.Include(i => i.ReportedBy).AsQueryable();

        if (!string.IsNullOrWhiteSpace(req.Status) &&
            Enum.TryParse<IncidentStatus>(req.Status, true, out var statusFilter))
            query = query.Where(i => i.Status == statusFilter);

        var list = await query
            .OrderByDescending(i => i.IsSos)
            .ThenByDescending(i => i.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(i => new IncidentDto(
                i.Id, i.ReportedByUserId, i.ReportedBy.Name ?? string.Empty,
                i.TripId, i.IncidentType.ToString(), i.Status.ToString(),
                i.Description, i.EscalationNote, i.Resolution,
                i.IsSos, i.Lat, i.Lng, i.CreatedAt, i.ResolvedAt))
            .ToListAsync(ct);

        return Result<List<IncidentDto>>.Ok(list);
    }
}
