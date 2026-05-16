using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Request.Commands;
using CommutePool.Modules.Request.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Request.Handlers;

// RideRequest in the current schema is a rider's corridor-based request (not offer-specific).
// Status values: Active, Paused, Closed  (RideRequestStatus enum)

public sealed class SendRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<SendRideRequestCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(SendRideRequestCommand req, CancellationToken ct)
    {
        var profile = await db.CommuteProfiles.FindAsync([req.CommuteProfileId], ct);
        if (profile is null) return Result<Guid>.Fail("NOT_FOUND", "Commute profile not found.");
        if (profile.UserId != req.RiderId) return Result<Guid>.Fail("FORBIDDEN", "Not your commute profile.");

        var duplicate = await db.RideRequests.AnyAsync(
            r => r.RiderId == req.RiderId
              && r.CommuteProfileId == req.CommuteProfileId
              && r.Status == RideRequestStatus.Active, ct);
        if (duplicate) return Result<Guid>.Fail("ALREADY_ACTIVE", "An active request already exists for this profile.");

        // Parse PickupModePref from string (command carries optional string, entity carries enum)
        var pickupMode = PickupMode.RoutePointOnly;
        if (!string.IsNullOrWhiteSpace(req.PickupModePref))
            Enum.TryParse<PickupMode>(req.PickupModePref, ignoreCase: true, out pickupMode);

        var rideRequest = new RideRequestEntity
        {
            Id = Guid.NewGuid(),
            RiderId = req.RiderId,
            CommuteProfileId = req.CommuteProfileId,
            CorridorId = profile.CorridorId,
            PickupModePref = pickupMode,
            Status = RideRequestStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.RideRequests.Add(rideRequest);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(rideRequest.Id);
    }
}

public sealed class PauseRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<PauseRideRequestCommand, Result>
{
    public async Task<Result> Handle(PauseRideRequestCommand req, CancellationToken ct)
    {
        var rideRequest = await db.RideRequests
            .FirstOrDefaultAsync(r => r.Id == req.RequestId && r.RiderId == req.RiderId, ct);
        if (rideRequest is null) return Result.Fail("NOT_FOUND", "Request not found.");
        if (rideRequest.Status != RideRequestStatus.Active)
            return Result.Fail("INVALID_STATE", "Only active requests can be paused.");

        rideRequest.Status = RideRequestStatus.Paused;
        rideRequest.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class ResumeRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<ResumeRideRequestCommand, Result>
{
    public async Task<Result> Handle(ResumeRideRequestCommand req, CancellationToken ct)
    {
        var rideRequest = await db.RideRequests
            .FirstOrDefaultAsync(r => r.Id == req.RequestId && r.RiderId == req.RiderId, ct);
        if (rideRequest is null) return Result.Fail("NOT_FOUND", "Request not found.");
        if (rideRequest.Status != RideRequestStatus.Paused)
            return Result.Fail("INVALID_STATE", "Only paused requests can be resumed.");

        rideRequest.Status = RideRequestStatus.Active;
        rideRequest.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class CloseRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<CloseRideRequestCommand, Result>
{
    public async Task<Result> Handle(CloseRideRequestCommand req, CancellationToken ct)
    {
        var rideRequest = await db.RideRequests
            .FirstOrDefaultAsync(r => r.Id == req.RequestId && r.RiderId == req.RiderId, ct);
        if (rideRequest is null) return Result.Fail("NOT_FOUND", "Request not found.");
        if (rideRequest.Status == RideRequestStatus.Closed)
            return Result.Fail("ALREADY_CLOSED", "Request is already closed.");

        rideRequest.Status = RideRequestStatus.Closed;
        rideRequest.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyRideRequestsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyRideRequestsQuery, Result<List<RideRequestDto>>>
{
    public async Task<Result<List<RideRequestDto>>> Handle(GetMyRideRequestsQuery req, CancellationToken ct)
    {
        // RideRequestDto shape: (Id, OfferId, RiderId, RiderName, Status, Note, DeclineReason, CreatedAt)
        // RideRequestEntity has no OfferId/RiderName/Note/DeclineReason — use Guid.Empty/empty string as stubs
        var list = await db.RideRequests
            .Where(r => r.RiderId == req.RiderId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(r => new RideRequestDto(
                r.Id,
                Guid.Empty,          // OfferId — not stored on entity; stub
                r.RiderId,
                string.Empty,        // RiderName — not joined here; stub
                r.Status.ToString(),
                null,                // Note
                null,                // DeclineReason
                r.CreatedAt))
            .ToListAsync(ct);
        return Result<List<RideRequestDto>>.Ok(list);
    }
}
