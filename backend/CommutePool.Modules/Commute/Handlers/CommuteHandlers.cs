using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Commute.Commands;
using CommutePool.Modules.Commute.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Commute.Handlers;

public sealed class UpsertCommuteProfileHandler(
    CommutePoolDbContext db) : IRequestHandler<UpsertCommuteProfileCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(UpsertCommuteProfileCommand req, CancellationToken ct)
    {
        var corridor = await db.Corridors.FindAsync([req.CorridorId], ct);
        if (corridor is null || !corridor.Active)
            return Result<Guid>.Fail("INVALID_CORRIDOR", "Corridor not found or inactive.");

        var profile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == req.UserId, ct);

        if (profile is null)
        {
            profile = new CommuteProfileEntity
            {
                Id = Guid.NewGuid(),
                UserId = req.UserId,
                CorridorId = req.CorridorId,
                HomeArea = req.HomeArea,
                HomeLat = req.HomeLat,
                HomeLng = req.HomeLng,
                OfficeArea = req.OfficeArea,
                OfficeLat = req.OfficeLat,
                OfficeLng = req.OfficeLng,
                MorningDepartureTime = req.MorningDepartureTime,
                EveningDepartureTime = req.EveningDepartureTime,
                ActiveDays = req.ActiveDays,
                Paused = false,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.CommuteProfiles.Add(profile);
        }
        else
        {
            profile.CorridorId = req.CorridorId;
            profile.HomeArea = req.HomeArea;
            profile.HomeLat = req.HomeLat;
            profile.HomeLng = req.HomeLng;
            profile.OfficeArea = req.OfficeArea;
            profile.OfficeLat = req.OfficeLat;
            profile.OfficeLng = req.OfficeLng;
            profile.MorningDepartureTime = req.MorningDepartureTime;
            profile.EveningDepartureTime = req.EveningDepartureTime;
            profile.ActiveDays = req.ActiveDays;
            profile.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(profile.Id);
    }
}

public sealed class PauseCommuteProfileHandler(
    CommutePoolDbContext db) : IRequestHandler<PauseCommuteProfileCommand, Result>
{
    public async Task<Result> Handle(PauseCommuteProfileCommand req, CancellationToken ct)
    {
        var profile = await db.CommuteProfiles.FirstOrDefaultAsync(p => p.UserId == req.UserId, ct);
        if (profile is null) return Result.Fail("NOT_FOUND", "No commute profile found.");
        profile.Paused = true;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class ResumeCommuteProfileHandler(
    CommutePoolDbContext db) : IRequestHandler<ResumeCommuteProfileCommand, Result>
{
    public async Task<Result> Handle(ResumeCommuteProfileCommand req, CancellationToken ct)
    {
        var profile = await db.CommuteProfiles.FirstOrDefaultAsync(p => p.UserId == req.UserId, ct);
        if (profile is null) return Result.Fail("NOT_FOUND", "No commute profile found.");
        profile.Paused = false;
        profile.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyCommuteProfileHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyCommuteProfileQuery, Result<CommuteProfileDto?>>
{
    public async Task<Result<CommuteProfileDto?>> Handle(GetMyCommuteProfileQuery req, CancellationToken ct)
    {
        var p = await db.CommuteProfiles
            .Include(x => x.Corridor)
            .FirstOrDefaultAsync(x => x.UserId == req.UserId, ct);

        if (p is null) return Result<CommuteProfileDto?>.Ok(null);

        return Result<CommuteProfileDto?>.Ok(new CommuteProfileDto(
            p.Id, p.CorridorId, p.Corridor.Name,
            p.HomeArea, p.HomeLat, p.HomeLng,
            p.OfficeArea, p.OfficeLat, p.OfficeLng,
            p.MorningDepartureTime.ToString("HH:mm"),
            p.EveningDepartureTime.ToString("HH:mm"),
            p.ActiveDays, p.Paused));
    }
}
