using CommutePool.Infrastructure.Persistence;
using CommutePool.Modules.Analytics.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Analytics.Handlers;

public sealed class GetTripMetricsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetTripMetricsQuery, Result<TripMetricsDto>>
{
    public async Task<Result<TripMetricsDto>> Handle(GetTripMetricsQuery req, CancellationToken ct)
    {
        var fromDto = req.From.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toDto = req.To.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var trips = await db.Trips
            .Where(t => t.CreatedAt >= fromDto && t.CreatedAt <= toDto)
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Count(),
                Completed = g.Count(t => t.Status == TripStatus.Completed),
                Cancelled = g.Count(t => t.Status == TripStatus.Cancelled),
                NoShow = g.Count(t => t.Status == TripStatus.NoShow)
            })
            .FirstOrDefaultAsync(ct);

        var total = trips?.Total ?? 0;
        var completed = trips?.Completed ?? 0;
        var rate = total == 0 ? 0.0 : Math.Round((double)completed / total * 100, 2);

        return Result<TripMetricsDto>.Ok(new TripMetricsDto(
            total, completed,
            trips?.Cancelled ?? 0,
            trips?.NoShow ?? 0,
            rate));
    }
}

public sealed class GetFunnelMetricsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetFunnelMetricsQuery, Result<FunnelMetricsDto>>
{
    public async Task<Result<FunnelMetricsDto>> Handle(GetFunnelMetricsQuery req, CancellationToken ct)
    {
        var fromDto = req.From.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toDto = req.To.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var totalUsers = await db.Users.CountAsync(u => u.CreatedAt >= fromDto && u.CreatedAt <= toDto, ct);
        var verifiedUsers = await db.OwnerEligibilities
            .CountAsync(e => e.Status == OwnerEligibilityStatus.Eligible, ct);
        var withProfile = await db.CommuteProfiles.Select(p => p.UserId).Distinct().CountAsync(ct);
        var madeOffer = await db.Offers.Select(o => o.OwnerId).Distinct().CountAsync(ct);
        var madeRequest = await db.RideRequests.Select(r => r.RiderId).Distinct().CountAsync(ct);
        var completedTrip = await db.Trips
            .Where(t => t.Status == TripStatus.Completed)
            .Select(t => t.OwnerId)
            .Union(db.Trips.Where(t => t.Status == TripStatus.Completed).Select(t => t.RiderId))
            .Distinct()
            .CountAsync(ct);

        return Result<FunnelMetricsDto>.Ok(new FunnelMetricsDto(
            totalUsers, verifiedUsers, withProfile,
            madeOffer, madeRequest, completedTrip));
    }
}
