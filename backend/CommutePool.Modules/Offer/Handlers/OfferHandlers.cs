using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Offer.Commands;
using CommutePool.Modules.Offer.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Offer.Handlers;

public sealed class CreateOfferHandler(
    CommutePoolDbContext db) : IRequestHandler<CreateOfferCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateOfferCommand req, CancellationToken ct)
    {
        // Gate 1: vehicle must be active and owned by this user
        var vehicle = await db.Vehicles
            .FirstOrDefaultAsync(v => v.Id == req.VehicleId && v.UserId == req.OwnerId && v.Active, ct);
        if (vehicle is null)
            return Result<Guid>.Fail("INVALID_VEHICLE", "Active vehicle not found for this owner.");

        // Gate 2: commute profile must belong to this user
        var profile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.Id == req.CommuteProfileId && p.UserId == req.OwnerId, ct);
        if (profile is null)
            return Result<Guid>.Fail("INVALID_PROFILE", "Commute profile not found.");

        // Gate 3: no duplicate active offer for same date+direction
        var duplicate = await db.Offers.AnyAsync(
            o => o.OwnerId == req.OwnerId
              && o.OfferDate == req.OfferDate
              && o.Direction == req.Direction
              && (o.Status == OfferStatus.Open || o.Status == OfferStatus.Partial),
            ct);
        if (duplicate)
            return Result<Guid>.Fail("DUPLICATE_OFFER", "An active offer already exists for this date and direction.");

        var offer = new OfferEntity
        {
            Id = Guid.NewGuid(),
            OwnerId = req.OwnerId,
            VehicleId = req.VehicleId,
            CommuteProfileId = req.CommuteProfileId,
            Direction = req.Direction,
            OfferDate = req.OfferDate,
            DepartureTime = req.DepartureTime,
            AvailableSeats = req.AvailableSeats,
            AcceptedSeats = 0,
            StartLat = req.StartLat,
            StartLng = req.StartLng,
            EndLat = req.EndLat,
            EndLng = req.EndLng,
            Status = OfferStatus.Open,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Offers.Add(offer);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(offer.Id);
    }
}

public sealed class CancelOfferHandler(
    CommutePoolDbContext db) : IRequestHandler<CancelOfferCommand, Result>
{
    public async Task<Result> Handle(CancelOfferCommand req, CancellationToken ct)
    {
        var offer = await db.Offers
            .FirstOrDefaultAsync(o => o.Id == req.OfferId && o.OwnerId == req.OwnerId, ct);
        if (offer is null) return Result.Fail("NOT_FOUND", "Offer not found.");

        if (offer.Status is OfferStatus.Cancelled or OfferStatus.Completed)
            return Result.Fail("INVALID_STATE", "Offer is already cancelled or completed.");

        offer.Status = OfferStatus.Cancelled;
        offer.CancelReason = req.Reason;
        offer.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyOffersHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyOffersQuery, Result<List<OfferDto>>>
{
    public async Task<Result<List<OfferDto>>> Handle(GetMyOffersQuery req, CancellationToken ct)
    {
        var offers = await db.Offers
            .Include(o => o.Owner)
            .Include(o => o.Vehicle)
            .Where(o => o.OwnerId == req.OwnerId)
            .OrderByDescending(o => o.OfferDate)
            .ThenByDescending(o => o.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(o => MapToDto(o))
            .ToListAsync(ct);
        return Result<List<OfferDto>>.Ok(offers);
    }

    private static OfferDto MapToDto(OfferEntity o) => new(
        o.Id, o.OwnerId, o.Owner.Name ?? string.Empty,
        o.VehicleId, o.Vehicle.RegistrationNo,
        o.Direction.ToString(), o.OfferDate,
        o.DepartureTime.ToString("HH:mm"),
        o.AvailableSeats, o.AcceptedSeats,
        o.StartLat, o.StartLng, o.EndLat, o.EndLng,
        o.Status.ToString(), o.CreatedAt);
}

public sealed class GetOfferDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetOfferDetailQuery, Result<OfferDto>>
{
    public async Task<Result<OfferDto>> Handle(GetOfferDetailQuery req, CancellationToken ct)
    {
        var o = await db.Offers
            .Include(x => x.Owner)
            .Include(x => x.Vehicle)
            .FirstOrDefaultAsync(x => x.Id == req.OfferId, ct);

        if (o is null) return Result<OfferDto>.Fail("NOT_FOUND", "Offer not found.");

        return Result<OfferDto>.Ok(new OfferDto(
            o.Id, o.OwnerId, o.Owner.Name ?? string.Empty,
            o.VehicleId, o.Vehicle.RegistrationNo,
            o.Direction.ToString(), o.OfferDate,
            o.DepartureTime.ToString("HH:mm"),
            o.AvailableSeats, o.AcceptedSeats,
            o.StartLat, o.StartLng, o.EndLat, o.EndLng,
            o.Status.ToString(), o.CreatedAt));
    }
}

public sealed class GetAvailableOffersForRiderHandler(
    CommutePoolDbContext db) : IRequestHandler<GetAvailableOffersForRiderQuery, Result<List<OfferDto>>>
{
    public async Task<Result<List<OfferDto>>> Handle(GetAvailableOffersForRiderQuery req, CancellationToken ct)
    {
        var offers = await db.Offers
            .Include(o => o.Owner)
            .Include(o => o.Vehicle)
            .Where(o =>
                o.OfferDate == req.Date &&
                (o.Status == OfferStatus.Open || o.Status == OfferStatus.Partial) &&
                o.OwnerId != req.RiderId &&
                o.Vehicle.Active)
            .OrderBy(o => o.DepartureTime)
            .Select(o => new OfferDto(
                o.Id, o.OwnerId, o.Owner.Name ?? string.Empty,
                o.VehicleId, o.Vehicle.RegistrationNo,
                o.Direction.ToString(), o.OfferDate,
                o.DepartureTime.ToString("HH:mm"),
                o.AvailableSeats, o.AcceptedSeats,
                o.StartLat, o.StartLng, o.EndLat, o.EndLng,
                o.Status.ToString(), o.CreatedAt))
            .ToListAsync(ct);

        return Result<List<OfferDto>>.Ok(offers);
    }
}
