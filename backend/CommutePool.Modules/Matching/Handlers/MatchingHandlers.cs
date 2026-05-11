using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Matching.Commands;
using CommutePool.Modules.Matching.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Matching.Handlers;

public sealed class GenerateMatchHandler(
    CommutePoolDbContext db) : IRequestHandler<GenerateMatchCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(GenerateMatchCommand req, CancellationToken ct)
    {
        // Score: base 100, deduct for schedule mismatch, boost for same corridor
        var offer = await db.Offers
            .Include(o => o.Vehicle)
            .FirstOrDefaultAsync(o => o.Id == req.OfferId, ct);

        var riderProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == req.RiderId, ct);

        var ownerProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == req.OwnerId, ct);

        int score = 100;

        if (offer is not null && riderProfile is not null && ownerProfile is not null)
        {
            // Same corridor
            if (riderProfile.CorridorId == ownerProfile.CorridorId) score += 20;

            // Departure time proximity (within 30 min = +10, within 1hr = +5)
            var timeDiff = Math.Abs(
                (offer.DepartureTime - riderProfile.MorningDepartureTime).TotalMinutes);
            if (timeDiff <= 30) score += 10;
            else if (timeDiff <= 60) score += 5;
        }

        var match = new MatchEntity
        {
            Id = Guid.NewGuid(),
            OfferId = req.OfferId,
            RideRequestId = req.RideRequestId,
            OwnerId = req.OwnerId,
            RiderId = req.RiderId,
            Score = score,
            Status = MatchStatus.Confirmed,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Matches.Add(match);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(match.Id);
    }
}

public sealed class ConfirmMatchHandler(
    CommutePoolDbContext db) : IRequestHandler<ConfirmMatchCommand, Result>
{
    public async Task<Result> Handle(ConfirmMatchCommand req, CancellationToken ct)
    {
        var match = await db.Matches.FindAsync([req.MatchId], ct);
        if (match is null) return Result.Fail("NOT_FOUND", "Match not found.");
        match.Status = MatchStatus.Confirmed;
        match.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class ExpireMatchHandler(
    CommutePoolDbContext db) : IRequestHandler<ExpireMatchCommand, Result>
{
    public async Task<Result> Handle(ExpireMatchCommand req, CancellationToken ct)
    {
        var match = await db.Matches.FindAsync([req.MatchId], ct);
        if (match is null) return Result.Fail("NOT_FOUND", "Match not found.");
        match.Status = MatchStatus.Expired;
        match.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyMatchesHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyMatchesQuery, Result<List<MatchDto>>>
{
    public async Task<Result<List<MatchDto>>> Handle(GetMyMatchesQuery req, CancellationToken ct)
    {
        var list = await db.Matches
            .Include(m => m.Owner)
            .Include(m => m.Rider)
            .Where(m => m.OwnerId == req.UserId || m.RiderId == req.UserId)
            .OrderByDescending(m => m.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(m => new MatchDto(
                m.Id, m.OfferId, m.RideRequestId,
                m.OwnerId, m.Owner.Name ?? string.Empty,
                m.RiderId, m.Rider.Name ?? string.Empty,
                m.Score, m.Status.ToString(),
                m.PickupOptionId, m.CreatedAt))
            .ToListAsync(ct);
        return Result<List<MatchDto>>.Ok(list);
    }
}

public sealed class GetMatchDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMatchDetailQuery, Result<MatchDto>>
{
    public async Task<Result<MatchDto>> Handle(GetMatchDetailQuery req, CancellationToken ct)
    {
        var m = await db.Matches
            .Include(x => x.Owner)
            .Include(x => x.Rider)
            .FirstOrDefaultAsync(x => x.Id == req.MatchId, ct);
        if (m is null) return Result<MatchDto>.Fail("NOT_FOUND", "Match not found.");
        return Result<MatchDto>.Ok(new MatchDto(
            m.Id, m.OfferId, m.RideRequestId,
            m.OwnerId, m.Owner.Name ?? string.Empty,
            m.RiderId, m.Rider.Name ?? string.Empty,
            m.Score, m.Status.ToString(),
            m.PickupOptionId, m.CreatedAt));
    }
}
