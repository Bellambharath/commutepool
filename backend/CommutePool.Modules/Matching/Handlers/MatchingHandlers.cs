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
        var offer = await db.RideOffers
            .FirstOrDefaultAsync(o => o.Id == req.OfferId, ct);

        var riderProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == req.RiderId, ct);

        var ownerProfile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.UserId == req.OwnerId, ct);

        decimal score = 100m;

        if (offer is not null && riderProfile is not null && ownerProfile is not null)
        {
            // Boost: same corridor
            if (riderProfile.CorridorId == ownerProfile.CorridorId) score += 20m;

            // Boost: morning window overlap (rider window midpoint vs owner window midpoint)
            var riderMid = riderProfile.MorningWindowStart
                .Add(TimeSpan.FromMinutes(
                    (riderProfile.MorningWindowEnd - riderProfile.MorningWindowStart).TotalMinutes / 2));
            var ownerMid = ownerProfile.MorningWindowStart
                .Add(TimeSpan.FromMinutes(
                    (ownerProfile.MorningWindowEnd - ownerProfile.MorningWindowStart).TotalMinutes / 2));

            var diffMinutes = Math.Abs((riderMid - ownerMid).TotalMinutes);
            if (diffMinutes <= 30) score += 10m;
            else if (diffMinutes <= 60) score += 5m;
        }

        var match = new MatchCandidateEntity
        {
            Id = Guid.NewGuid(),
            OfferId = req.OfferId,
            RequestId = req.RideRequestId,
            CorridorId = riderProfile?.CorridorId ?? ownerProfile?.CorridorId ?? Guid.Empty,
            Score = score,
            Status = MatchStatus.Proposed,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.MatchCandidates.Add(match);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(match.Id);
    }
}

public sealed class ConfirmMatchHandler(
    CommutePoolDbContext db) : IRequestHandler<ConfirmMatchCommand, Result>
{
    public async Task<Result> Handle(ConfirmMatchCommand req, CancellationToken ct)
    {
        var match = await db.MatchCandidates.FindAsync([req.MatchId], ct);
        if (match is null) return Result.Fail("NOT_FOUND", "Match not found.");
        match.Status = MatchStatus.Accepted;
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
        var match = await db.MatchCandidates.FindAsync([req.MatchId], ct);
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
        // Load candidates where user is owner (via offer) or rider (via request)
        var offerIds = await db.RideOffers
            .Where(o => o.OwnerId == req.UserId)
            .Select(o => o.Id)
            .ToListAsync(ct);

        var requestIds = await db.RideRequests
            .Where(r => r.RiderId == req.UserId)
            .Select(r => r.Id)
            .ToListAsync(ct);

        var candidates = await db.MatchCandidates
            .Where(m => offerIds.Contains(m.OfferId) || requestIds.Contains(m.RequestId))
            .OrderByDescending(m => m.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .ToListAsync(ct);

        // Resolve owner/rider names via offer → owner and request → rider
        var allOfferIds = candidates.Select(c => c.OfferId).Distinct().ToList();
        var allRequestIds = candidates.Select(c => c.RequestId).Distinct().ToList();

        var offerOwners = await db.RideOffers
            .Where(o => allOfferIds.Contains(o.Id))
            .Join(db.Users, o => o.OwnerId, u => u.Id,
                (o, u) => new { o.Id, OwnerId = u.Id, OwnerName = u.Name ?? string.Empty })
            .ToDictionaryAsync(x => x.Id, ct);

        var requestRiders = await db.RideRequests
            .Where(r => allRequestIds.Contains(r.Id))
            .Join(db.Users, r => r.RiderId, u => u.Id,
                (r, u) => new { r.Id, RiderId = u.Id, RiderName = u.Name ?? string.Empty })
            .ToDictionaryAsync(x => x.Id, ct);

        var list = candidates.Select(m =>
        {
            offerOwners.TryGetValue(m.OfferId, out var ownerInfo);
            requestRiders.TryGetValue(m.RequestId, out var riderInfo);
            return new MatchDto(
                m.Id, m.OfferId, m.RequestId,
                ownerInfo?.OwnerId ?? Guid.Empty, ownerInfo?.OwnerName ?? string.Empty,
                riderInfo?.RiderId ?? Guid.Empty, riderInfo?.RiderName ?? string.Empty,
                (int)(m.Score ?? 0), m.Status.ToString(),
                null, m.CreatedAt);
        }).ToList();

        return Result<List<MatchDto>>.Ok(list);
    }
}

public sealed class GetMatchDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMatchDetailQuery, Result<MatchDto>>
{
    public async Task<Result<MatchDto>> Handle(GetMatchDetailQuery req, CancellationToken ct)
    {
        var m = await db.MatchCandidates
            .FirstOrDefaultAsync(x => x.Id == req.MatchId, ct);
        if (m is null) return Result<MatchDto>.Fail("NOT_FOUND", "Match not found.");

        var ownerInfo = await db.RideOffers
            .Where(o => o.Id == m.OfferId)
            .Join(db.Users, o => o.OwnerId, u => u.Id,
                (o, u) => new { OwnerId = u.Id, OwnerName = u.Name ?? string.Empty })
            .FirstOrDefaultAsync(ct);

        var riderInfo = await db.RideRequests
            .Where(r => r.Id == m.RequestId)
            .Join(db.Users, r => r.RiderId, u => u.Id,
                (r, u) => new { RiderId = u.Id, RiderName = u.Name ?? string.Empty })
            .FirstOrDefaultAsync(ct);

        return Result<MatchDto>.Ok(new MatchDto(
            m.Id, m.OfferId, m.RequestId,
            ownerInfo?.OwnerId ?? Guid.Empty, ownerInfo?.OwnerName ?? string.Empty,
            riderInfo?.RiderId ?? Guid.Empty, riderInfo?.RiderName ?? string.Empty,
            (int)(m.Score ?? 0), m.Status.ToString(),
            null, m.CreatedAt));
    }
}
