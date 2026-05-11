using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Vehicle.Commands;
using CommutePool.Modules.Vehicle.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Vehicle.Handlers;

public sealed class RegisterVehicleHandler(
    CommutePoolDbContext db) : IRequestHandler<RegisterVehicleCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(RegisterVehicleCommand request, CancellationToken ct)
    {
        // Verify owner eligibility
        var eligible = await db.OwnerEligibilities
            .AnyAsync(e => e.UserId == request.UserId
                && e.Status == CommutePool.Shared.Enums.OwnerEligibilityStatus.Eligible, ct);

        if (!eligible)
            return Result<Guid>.Fail("NOT_ELIGIBLE", "User must be verified as owner-eligible before registering a vehicle.");

        var vehicle = new VehicleEntity
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            RegistrationNo = request.RegistrationNo,
            Make = request.Make,
            Model = request.Model,
            VehicleType = "BIKE",
            Active = false,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Vehicles.Add(vehicle);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(vehicle.Id);
    }
}

public sealed class ActivateVehicleHandler(
    CommutePoolDbContext db) : IRequestHandler<ActivateVehicleCommand, Result>
{
    public async Task<Result> Handle(ActivateVehicleCommand request, CancellationToken ct)
    {
        var vehicle = await db.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.UserId == request.UserId, ct);

        if (vehicle is null) return Result.Fail("NOT_FOUND", "Vehicle not found.");

        // Deactivate all others first (one active vehicle per owner in v1)
        var others = await db.Vehicles
            .Where(v => v.UserId == request.UserId && v.Active)
            .ToListAsync(ct);
        others.ForEach(v => { v.Active = false; v.UpdatedAt = DateTimeOffset.UtcNow; });

        vehicle.Active = true;
        vehicle.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class DeactivateVehicleHandler(
    CommutePoolDbContext db) : IRequestHandler<DeactivateVehicleCommand, Result>
{
    public async Task<Result> Handle(DeactivateVehicleCommand request, CancellationToken ct)
    {
        var vehicle = await db.Vehicles
            .FirstOrDefaultAsync(v => v.Id == request.VehicleId && v.UserId == request.UserId, ct);

        if (vehicle is null) return Result.Fail("NOT_FOUND", "Vehicle not found.");
        vehicle.Active = false;
        vehicle.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyVehiclesHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyVehiclesQuery, Result<List<VehicleDto>>>
{
    public async Task<Result<List<VehicleDto>>> Handle(GetMyVehiclesQuery request, CancellationToken ct)
    {
        var vehicles = await db.Vehicles
            .Where(v => v.UserId == request.UserId)
            .OrderByDescending(v => v.Active)
            .ThenByDescending(v => v.CreatedAt)
            .Select(v => new VehicleDto(v.Id, v.RegistrationNo, v.Make, v.Model, v.Active, v.CreatedAt))
            .ToListAsync(ct);

        return Result<List<VehicleDto>>.Ok(vehicles);
    }
}
