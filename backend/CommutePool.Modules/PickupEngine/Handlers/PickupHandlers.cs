using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.PickupEngine.Commands;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.PickupEngine.Handlers;

public sealed class GeneratePickupOptionsHandler(
    CommutePoolDbContext db) : IRequestHandler<GeneratePickupOptionsCommand, Result<List<PickupOptionDto>>>
{
    public async Task<Result<List<PickupOptionDto>>> Handle(GeneratePickupOptionsCommand req, CancellationToken ct)
    {
        var match = await db.Matches
            .Include(m => m.Rider)
            .Include(m => m.Owner)
            .FirstOrDefaultAsync(m => m.Id == req.MatchId, ct);
        if (match is null) return Result<List<PickupOptionDto>>.Fail("NOT_FOUND", "Match not found.");

        var riderProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == match.RiderId, ct);
        var ownerProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == match.OwnerId, ct);

        if (riderProfile is null || ownerProfile is null)
            return Result<List<PickupOptionDto>>.Fail("MISSING_PROFILES", "Commute profiles not found.");

        // Midpoint calculation
        var midLat = (riderProfile.HomeLat + ownerProfile.HomeLat) / 2.0;
        var midLng = (riderProfile.HomeLng + ownerProfile.HomeLng) / 2.0;

        var options = new List<PickupOptionEntity>
        {
            new()
            {
                Id = Guid.NewGuid(),
                MatchId = req.MatchId,
                Label = "Midpoint",
                Lat = midLat,
                Lng = midLng,
                GeneratedBy = "MIDPOINT",
                Selected = false,
                CreatedAt = DateTimeOffset.UtcNow
            },
            new()
            {
                Id = Guid.NewGuid(),
                MatchId = req.MatchId,
                Label = "Near Rider Home",
                Lat = riderProfile.HomeLat,
                Lng = riderProfile.HomeLng,
                GeneratedBy = "PROXIMITY",
                Selected = false,
                CreatedAt = DateTimeOffset.UtcNow
            }
        };

        db.PickupOptions.AddRange(options);
        await db.SaveChangesAsync(ct);

        return Result<List<PickupOptionDto>>.Ok(options
            .Select(o => new PickupOptionDto(o.Id, o.MatchId, o.Label, o.Lat, o.Lng, o.GeneratedBy, o.Selected))
            .ToList());
    }
}

public sealed class SelectPickupOptionHandler(
    CommutePoolDbContext db) : IRequestHandler<SelectPickupOptionCommand, Result>
{
    public async Task<Result> Handle(SelectPickupOptionCommand req, CancellationToken ct)
    {
        var match = await db.Matches.FindAsync([req.MatchId], ct);
        if (match is null) return Result.Fail("NOT_FOUND", "Match not found.");

        if (match.OwnerId != req.SelectedByUserId && match.RiderId != req.SelectedByUserId)
            return Result.Fail("FORBIDDEN", "Not a participant of this match.");

        // Deselect others
        var allOptions = await db.PickupOptions
            .Where(p => p.MatchId == req.MatchId)
            .ToListAsync(ct);
        allOptions.ForEach(p => p.Selected = false);

        var chosen = allOptions.FirstOrDefault(p => p.Id == req.PickupOptionId);
        if (chosen is null) return Result.Fail("NOT_FOUND", "Pickup option not found.");
        chosen.Selected = true;

        match.PickupOptionId = chosen.Id;
        match.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}
