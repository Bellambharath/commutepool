using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Corridor.Commands;
using CommutePool.Modules.Corridor.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Corridor.Handlers;

public sealed class CreateCorridorHandler(
    CommutePoolDbContext db) : IRequestHandler<CreateCorridorCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(CreateCorridorCommand req, CancellationToken ct)
    {
        if (await db.Corridors.AnyAsync(c => c.Slug == req.Slug, ct))
            return Result<Guid>.Fail("DUPLICATE_SLUG", "A corridor with this slug already exists.");

        var corridor = new CorridorEntity
        {
            Id = Guid.NewGuid(),
            Name = req.Name,
            Slug = req.Slug,
            City = req.City,
            CenterLat = req.CenterLat,
            CenterLng = req.CenterLng,
            RadiusKm = req.RadiusKm,
            Active = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.Corridors.Add(corridor);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(corridor.Id);
    }
}

public sealed class DeactivateCorridorHandler(
    CommutePoolDbContext db) : IRequestHandler<DeactivateCorridorCommand, Result>
{
    public async Task<Result> Handle(DeactivateCorridorCommand req, CancellationToken ct)
    {
        var corridor = await db.Corridors.FindAsync([req.CorridorId], ct);
        if (corridor is null) return Result.Fail("NOT_FOUND", "Corridor not found.");
        corridor.Active = false;
        corridor.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class ListActiveCorridorsHandler(
    CommutePoolDbContext db) : IRequestHandler<ListActiveCorrdiorsQuery, Result<List<CorridorDto>>>
{
    public async Task<Result<List<CorridorDto>>> Handle(ListActiveCorrdiorsQuery req, CancellationToken ct)
    {
        var list = await db.Corridors
            .Where(c => c.Active)
            .OrderBy(c => c.Name)
            .Select(c => new CorridorDto(c.Id, c.Name, c.Slug, c.City, c.CenterLat, c.CenterLng, c.RadiusKm, c.Active))
            .ToListAsync(ct);
        return Result<List<CorridorDto>>.Ok(list);
    }
}

public sealed class GetCorridorByIdHandler(
    CommutePoolDbContext db) : IRequestHandler<GetCorridorByIdQuery, Result<CorridorDto>>
{
    public async Task<Result<CorridorDto>> Handle(GetCorridorByIdQuery req, CancellationToken ct)
    {
        var c = await db.Corridors.FindAsync([req.CorridorId], ct);
        if (c is null) return Result<CorridorDto>.Fail("NOT_FOUND", "Corridor not found.");
        return Result<CorridorDto>.Ok(new CorridorDto(c.Id, c.Name, c.Slug, c.City, c.CenterLat, c.CenterLng, c.RadiusKm, c.Active));
    }
}
