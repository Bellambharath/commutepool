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
        var vehicle = await db.Vehicles
            .FirstOrDefaultAsync(v => v.Id == req.VehicleId && v.UserId == req.OwnerId && v.Active, ct);
        if (vehicle is null)
            return Result<Guid>.Fail("INVALID_VEHICLE", "Active vehicle not found for this owner.");

        var profile = await db.CommuteProfiles
            .FirstOrDefaultAsync(p => p.Id == req.CommuteProfileId && p.UserId == req.OwnerId, ct);
        if (profile is null)
            return Result<Guid>.Fail("INVALID_PROFILE", "Commute profile not found.");

        var duplicate = await db.RideOffers.AnyAsync(
            o => o.OwnerId == req.OwnerId
              && o.Status == RideOfferStatus.Active,
            ct);
        if (duplicate)
            return Result<Guid>.Fail("DUPLICATE_OFFER", "An active offer already exists.");

        var offer = new RideOfferEntity
        {
            Id = Guid.NewGuid(),
            OwnerId = req.OwnerId,
            VehicleId = req.VehicleId,
            CommuteProfileId = req.CommuteProfileId,
            CorridorId = profile.CorridorId,
            AvailableSeats = req.AvailableSeats,
            Status = RideOfferStatus.Active,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.RideOffers.Add(offer);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(offer.Id);
    }
}

public sealed class CancelOfferHandler(
    CommutePoolDbContext db) : IRequestHandler<CancelOfferCommand, Result>
{
    public async Task<Result> Handle(CancelOfferCommand req, CancellationToken ct)
    {
        var offer = await db.RideOffers
            .FirstOrDefaultAsync(o => o.Id == req.OfferId && o.OwnerId == req.OwnerId, ct);
        if (offer is null) return Result.Fail("NOT_FOUND", "Offer not found.");

        if (offer.Status == RideOfferStatus.Closed)
            return Result.Fail("INVALID_STATE", "Offer is already closed.");

        offer.Status = RideOfferStatus.Closed;
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
        var offers = await db.RideOffers
            .Where(o => o.OwnerId == req.OwnerId)
            .OrderByDescending(o => o.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(o => new OfferDto(
                o.Id, o.OwnerId, o.VehicleId,
                o.AvailableSeats, o.Status.ToString(), o.CreatedAt))
            .ToListAsync(ct);
        return Result<List<OfferDto>>.Ok(offers);
    }
}

public sealed class GetOfferDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetOfferDetailQuery, Result<OfferDto>>
{
    public async Task<Result<OfferDto>> Handle(GetOfferDetailQuery req, CancellationToken ct)
    {
        var o = await db.RideOffers
            .FirstOrDefaultAsync(x => x.Id == req.OfferId, ct);
        if (o is null) return Result<OfferDto>.Fail("NOT_FOUND", "Offer not found.");
        return Result<OfferDto>.Ok(new OfferDto(
            o.Id, o.OwnerId, o.VehicleId,
            o.AvailableSeats, o.Status.ToString(), o.CreatedAt));
    }
}

public sealed class GetAvailableOffersForRiderHandler(
    CommutePoolDbContext db) : IRequestHandler<GetAvailableOffersForRiderQuery, Result<List<OfferDto>>>
{
    public async Task<Result<List<OfferDto>>> Handle(GetAvailableOffersForRiderQuery req, CancellationToken ct)
    {
        var offers = await db.RideOffers
            .Where(o => o.Status == RideOfferStatus.Active && o.OwnerId != req.RiderId)
            .OrderBy(o => o.CreatedAt)
            .Select(o => new OfferDto(
                o.Id, o.OwnerId, o.VehicleId,
                o.AvailableSeats, o.Status.ToString(), o.CreatedAt))
            .ToListAsync(ct);
        return Result<List<OfferDto>>.Ok(offers);
    }
}
