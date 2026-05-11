using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Request.Commands;
using CommutePool.Modules.Request.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Request.Handlers;

public sealed class SendRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<SendRideRequestCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(SendRideRequestCommand req, CancellationToken ct)
    {
        var offer = await db.Offers.FindAsync([req.OfferId], ct);
        if (offer is null) return Result<Guid>.Fail("NOT_FOUND", "Offer not found.");
        if (offer.OwnerId == req.RiderId) return Result<Guid>.Fail("SELF_REQUEST", "Cannot request your own offer.");
        if (offer.Status is not (OfferStatus.Open or OfferStatus.Partial))
            return Result<Guid>.Fail("OFFER_UNAVAILABLE", "Offer is not accepting requests.");
        if (offer.AvailableSeats - offer.AcceptedSeats <= 0)
            return Result<Guid>.Fail("NO_SEATS", "No seats available.");

        var duplicate = await db.RideRequests.AnyAsync(
            r => r.OfferId == req.OfferId && r.RiderId == req.RiderId
              && r.Status == RideRequestStatus.Pending, ct);
        if (duplicate) return Result<Guid>.Fail("ALREADY_REQUESTED", "You already have a pending request for this offer.");

        var rideRequest = new RideRequestEntity
        {
            Id = Guid.NewGuid(),
            OfferId = req.OfferId,
            RiderId = req.RiderId,
            Status = RideRequestStatus.Pending,
            Note = req.Note,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.RideRequests.Add(rideRequest);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(rideRequest.Id);
    }
}

public sealed class WithdrawRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<WithdrawRideRequestCommand, Result>
{
    public async Task<Result> Handle(WithdrawRideRequestCommand req, CancellationToken ct)
    {
        var rideRequest = await db.RideRequests
            .FirstOrDefaultAsync(r => r.Id == req.RequestId && r.RiderId == req.RiderId, ct);
        if (rideRequest is null) return Result.Fail("NOT_FOUND", "Request not found.");
        if (rideRequest.Status != RideRequestStatus.Pending)
            return Result.Fail("INVALID_STATE", "Only pending requests can be withdrawn.");

        rideRequest.Status = RideRequestStatus.Withdrawn;
        rideRequest.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class AcceptRideRequestHandler(
    CommutePoolDbContext db,
    IMediator mediator) : IRequestHandler<AcceptRideRequestCommand, Result>
{
    public async Task<Result> Handle(AcceptRideRequestCommand req, CancellationToken ct)
    {
        var rideRequest = await db.RideRequests
            .Include(r => r.Offer)
            .FirstOrDefaultAsync(r => r.Id == req.RequestId, ct);
        if (rideRequest is null) return Result.Fail("NOT_FOUND", "Request not found.");
        if (rideRequest.Offer.OwnerId != req.OwnerId)
            return Result.Fail("FORBIDDEN", "Not your offer.");
        if (rideRequest.Status != RideRequestStatus.Pending)
            return Result.Fail("INVALID_STATE", "Request is not pending.");

        var offer = rideRequest.Offer;
        if (offer.AvailableSeats - offer.AcceptedSeats <= 0)
            return Result.Fail("NO_SEATS", "No seats left.");

        rideRequest.Status = RideRequestStatus.Accepted;
        rideRequest.UpdatedAt = DateTimeOffset.UtcNow;

        offer.AcceptedSeats += 1;
        offer.Status = offer.AcceptedSeats >= offer.AvailableSeats
            ? OfferStatus.Full
            : OfferStatus.Partial;
        offer.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);

        // Trigger match generation for this pair
        await mediator.Send(new Matching.Commands.GenerateMatchCommand(
            rideRequest.Id, offer.Id, rideRequest.RiderId, offer.OwnerId), ct);

        return Result.Ok();
    }
}

public sealed class DeclineRideRequestHandler(
    CommutePoolDbContext db) : IRequestHandler<DeclineRideRequestCommand, Result>
{
    public async Task<Result> Handle(DeclineRideRequestCommand req, CancellationToken ct)
    {
        var rideRequest = await db.RideRequests
            .Include(r => r.Offer)
            .FirstOrDefaultAsync(r => r.Id == req.RequestId, ct);
        if (rideRequest is null) return Result.Fail("NOT_FOUND", "Request not found.");
        if (rideRequest.Offer.OwnerId != req.OwnerId)
            return Result.Fail("FORBIDDEN", "Not your offer.");
        if (rideRequest.Status != RideRequestStatus.Pending)
            return Result.Fail("INVALID_STATE", "Request is not pending.");

        rideRequest.Status = RideRequestStatus.Declined;
        rideRequest.DeclineReason = req.Reason;
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
        var list = await db.RideRequests
            .Include(r => r.Rider)
            .Where(r => r.RiderId == req.RiderId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(r => new RideRequestDto(r.Id, r.OfferId, r.RiderId, r.Rider.Name ?? string.Empty,
                r.Status.ToString(), r.Note, r.DeclineReason, r.CreatedAt))
            .ToListAsync(ct);
        return Result<List<RideRequestDto>>.Ok(list);
    }
}

public sealed class GetRequestsForOfferHandler(
    CommutePoolDbContext db) : IRequestHandler<GetRequestsForOfferQuery, Result<List<RideRequestDto>>>
{
    public async Task<Result<List<RideRequestDto>>> Handle(GetRequestsForOfferQuery req, CancellationToken ct)
    {
        var offer = await db.Offers.FindAsync([req.OfferId], ct);
        if (offer is null || offer.OwnerId != req.OwnerId)
            return Result<List<RideRequestDto>>.Fail("FORBIDDEN", "Not your offer.");

        var list = await db.RideRequests
            .Include(r => r.Rider)
            .Where(r => r.OfferId == req.OfferId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new RideRequestDto(r.Id, r.OfferId, r.RiderId, r.Rider.Name ?? string.Empty,
                r.Status.ToString(), r.Note, r.DeclineReason, r.CreatedAt))
            .ToListAsync(ct);
        return Result<List<RideRequestDto>>.Ok(list);
    }
}
