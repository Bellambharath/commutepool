using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Trip.Commands;
using CommutePool.Modules.Trip.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Trip.Handlers;

public sealed class StartTripHandler(
    CommutePoolDbContext db) : IRequestHandler<StartTripCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(StartTripCommand req, CancellationToken ct)
    {
        var match = await db.MatchCandidates
            .FirstOrDefaultAsync(m => m.Id == req.MatchId, ct);

        if (match is null) return Result<Guid>.Fail("NOT_FOUND", "Match not found.");

        var offer = await db.RideOffers.FindAsync([match.OfferId], ct);
        if (offer is null) return Result<Guid>.Fail("NOT_FOUND", "Ride offer not found.");
        if (offer.OwnerId != req.InitiatedByUserId)
            return Result<Guid>.Fail("FORBIDDEN", "Only the owner can start the trip.");

        if (match.Status != MatchStatus.Accepted)
            return Result<Guid>.Fail("INVALID_STATE", "Match is not accepted.");

        var existingTrip = await db.Trips.AnyAsync(t => t.MatchId == req.MatchId, ct);
        if (existingTrip)
            return Result<Guid>.Fail("DUPLICATE", "A trip already exists for this match.");

        var rideRequest = await db.RideRequests.FindAsync([match.RequestId], ct);
        var riderId = rideRequest?.RiderId ?? Guid.Empty;

        var trip = new TripEntity
        {
            Id = Guid.NewGuid(),
            MatchId = req.MatchId,
            OwnerId = offer.OwnerId,
            RiderId = riderId,
            CorridorId = match.CorridorId,
            Status = TripStatus.Started,
            StartedAt = DateTimeOffset.UtcNow,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        match.Status = MatchStatus.RecurringActive;
        match.UpdatedAt = DateTimeOffset.UtcNow;

        db.Trips.Add(trip);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(trip.Id);
    }
}

public sealed class CompleteTripHandler(
    CommutePoolDbContext db) : IRequestHandler<CompleteTripCommand, Result>
{
    public async Task<Result> Handle(CompleteTripCommand req, CancellationToken ct)
    {
        var trip = await db.Trips
            .FirstOrDefaultAsync(t => t.Id == req.TripId, ct);

        if (trip is null) return Result.Fail("NOT_FOUND", "Trip not found.");
        if (trip.OwnerId != req.InitiatedByUserId)
            return Result.Fail("FORBIDDEN", "Only the owner can complete the trip.");
        if (trip.Status != TripStatus.InProgress && trip.Status != TripStatus.Started)
            return Result.Fail("INVALID_STATE", "Trip is not in progress.");

        trip.Status = TripStatus.Completed;
        trip.CompletedAt = DateTimeOffset.UtcNow;
        trip.UpdatedAt = DateTimeOffset.UtcNow;

        var match = await db.MatchCandidates.FindAsync([trip.MatchId], ct);
        if (match is not null)
        {
            match.Status = MatchStatus.RecurringActive;
            match.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class CancelTripHandler(
    CommutePoolDbContext db) : IRequestHandler<CancelTripCommand, Result>
{
    public async Task<Result> Handle(CancelTripCommand req, CancellationToken ct)
    {
        var trip = await db.Trips
            .FirstOrDefaultAsync(t => t.Id == req.TripId, ct);

        if (trip is null) return Result.Fail("NOT_FOUND", "Trip not found.");
        if (trip.OwnerId != req.InitiatedByUserId && trip.RiderId != req.InitiatedByUserId)
            return Result.Fail("FORBIDDEN", "Not a participant of this trip.");
        if (trip.Status != TripStatus.InProgress && trip.Status != TripStatus.Started)
            return Result.Fail("INVALID_STATE", "Trip is not in progress.");

        trip.Status = TripStatus.Cancelled;
        trip.CancelledAt = DateTimeOffset.UtcNow;
        trip.CancelReason = req.Reason;
        trip.UpdatedAt = DateTimeOffset.UtcNow;

        var match = await db.MatchCandidates.FindAsync([trip.MatchId], ct);
        if (match is not null)
        {
            match.Status = MatchStatus.Rejected;
            match.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class MarkNoShowHandler(
    CommutePoolDbContext db) : IRequestHandler<MarkNoShowCommand, Result>
{
    public async Task<Result> Handle(MarkNoShowCommand req, CancellationToken ct)
    {
        var trip = await db.Trips
            .FirstOrDefaultAsync(t => t.Id == req.TripId, ct);

        if (trip is null) return Result.Fail("NOT_FOUND", "Trip not found.");
        if (trip.OwnerId != req.ReportedByUserId && trip.RiderId != req.ReportedByUserId)
            return Result.Fail("FORBIDDEN", "Not a participant of this trip.");

        trip.Status = TripStatus.Reported;
        trip.UpdatedAt = DateTimeOffset.UtcNow;

        var match = await db.MatchCandidates.FindAsync([trip.MatchId], ct);
        if (match is not null)
        {
            match.Status = MatchStatus.Rejected;
            match.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyTripsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyTripsQuery, Result<List<TripDto>>>
{
    public async Task<Result<List<TripDto>>> Handle(GetMyTripsQuery req, CancellationToken ct)
    {
        var trips = await db.Trips
            .Where(t => t.OwnerId == req.UserId || t.RiderId == req.UserId)
            .OrderByDescending(t => t.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(t => new TripDto(
                t.Id, t.MatchId,
                t.OwnerId, string.Empty,
                t.RiderId, string.Empty,
                t.Status.ToString(),
                t.StartedAt, t.CompletedAt, t.CancelledAt,
                t.CancelReason, t.CreatedAt))
            .ToListAsync(ct);

        return Result<List<TripDto>>.Ok(trips);
    }
}

public sealed class GetTripDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetTripDetailQuery, Result<TripDto>>
{
    public async Task<Result<TripDto>> Handle(GetTripDetailQuery req, CancellationToken ct)
    {
        var t = await db.Trips
            .FirstOrDefaultAsync(x => x.Id == req.TripId, ct);

        if (t is null) return Result<TripDto>.Fail("NOT_FOUND", "Trip not found.");
        if (t.OwnerId != req.RequestingUserId && t.RiderId != req.RequestingUserId)
            return Result<TripDto>.Fail("FORBIDDEN", "Not a participant of this trip.");

        return Result<TripDto>.Ok(new TripDto(
            t.Id, t.MatchId,
            t.OwnerId, string.Empty,
            t.RiderId, string.Empty,
            t.Status.ToString(),
            t.StartedAt, t.CompletedAt, t.CancelledAt,
            t.CancelReason, t.CreatedAt));
    }
}
