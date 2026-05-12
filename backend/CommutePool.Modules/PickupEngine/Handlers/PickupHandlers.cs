using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.PickupEngine.Commands;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace CommutePool.Modules.PickupEngine.Handlers;

internal sealed record GeoPoint(double Lat, double Lng);

public sealed class GeneratePickupOptionsHandler(
    CommutePoolDbContext db) : IRequestHandler<GeneratePickupOptionsCommand, Result<List<PickupOptionDto>>>
{
    private static GeoPoint? ParseGeo(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try { return JsonSerializer.Deserialize<GeoPoint>(json); }
        catch { return null; }
    }

    public async Task<Result<List<PickupOptionDto>>> Handle(GeneratePickupOptionsCommand req, CancellationToken ct)
    {
        var match = await db.MatchCandidates
            .FirstOrDefaultAsync(m => m.Id == req.MatchId, ct);
        if (match is null) return Result<List<PickupOptionDto>>.Fail("NOT_FOUND", "Match not found.");

        // Resolve owner from offer, rider from request
        var offer = await db.RideOffers.FirstOrDefaultAsync(o => o.Id == match.OfferId, ct);
        var request = await db.RideRequests.FirstOrDefaultAsync(r => r.Id == match.RequestId, ct);
        if (offer is null || request is null)
            return Result<List<PickupOptionDto>>.Fail("MISSING_DATA", "Offer or request not found.");

        var ownerProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == offer.OwnerId, ct);
        var riderProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == request.RiderId, ct);

        if (riderProfile is null || ownerProfile is null)
            return Result<List<PickupOptionDto>>.Fail("MISSING_PROFILES", "Commute profiles not found.");

        var riderGeo = ParseGeo(riderProfile.HomeGeo);
        var ownerGeo = ParseGeo(ownerProfile.HomeGeo);

        var options = new List<PickupOptionEntity>();

        if (riderGeo is not null && ownerGeo is not null)
        {
            options.Add(new PickupOptionEntity
            {
                Id = Guid.NewGuid(),
                MatchId = req.MatchId,
                Label = "Midpoint",
                Lat = (riderGeo.Lat + ownerGeo.Lat) / 2.0,
                Lng = (riderGeo.Lng + ownerGeo.Lng) / 2.0,
                GeneratedBy = "MIDPOINT",
                Selected = false,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        if (riderGeo is not null)
        {
            options.Add(new PickupOptionEntity
            {
                Id = Guid.NewGuid(),
                MatchId = req.MatchId,
                Label = "Near Rider Home",
                Lat = riderGeo.Lat,
                Lng = riderGeo.Lng,
                GeneratedBy = "PROXIMITY",
                Selected = false,
                CreatedAt = DateTimeOffset.UtcNow
            });
        }

        if (options.Count == 0)
            return Result<List<PickupOptionDto>>.Fail("NO_GEO", "No geo data available for pickup generation.");

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
        var match = await db.MatchCandidates.FindAsync([req.MatchId], ct);
        if (match is null) return Result.Fail("NOT_FOUND", "Match not found.");

        // Verify the requesting user is owner or rider of this match
        var offer = await db.RideOffers.FirstOrDefaultAsync(o => o.Id == match.OfferId, ct);
        var request = await db.RideRequests.FirstOrDefaultAsync(r => r.Id == match.RequestId, ct);

        var ownerId = offer?.OwnerId ?? Guid.Empty;
        var riderId = request?.RiderId ?? Guid.Empty;

        if (req.SelectedByUserId != ownerId && req.SelectedByUserId != riderId)
            return Result.Fail("FORBIDDEN", "Not a participant of this match.");

        // Deselect all, then select chosen
        var allOptions = await db.PickupOptions
            .Where(p => p.MatchId == req.MatchId)
            .ToListAsync(ct);
        allOptions.ForEach(p => p.Selected = false);

        var chosen = allOptions.FirstOrDefault(p => p.Id == req.PickupOptionId);
        if (chosen is null) return Result.Fail("NOT_FOUND", "Pickup option not found.");
        chosen.Selected = true;

        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}
