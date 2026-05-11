using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.UserProfile.Commands;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.UserProfile.Handlers;

public sealed class UpdateProfileHandler(
    CommutePoolDbContext db) : IRequestHandler<UpdateProfileCommand, Result>
{
    public async Task<Result> Handle(UpdateProfileCommand request, CancellationToken ct)
    {
        var user = await db.Users.FindAsync([request.UserId], ct);
        if (user is null)
            return Result.Fail("USER_NOT_FOUND", "User not found.");

        user.Name = request.Name;
        user.Email = request.Email;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class UpdateEmergencyContactHandler(
    CommutePoolDbContext db) : IRequestHandler<UpdateEmergencyContactCommand, Result>
{
    public async Task<Result> Handle(UpdateEmergencyContactCommand request, CancellationToken ct)
    {
        var existing = await db.EmergencyContacts
            .FirstOrDefaultAsync(e => e.UserId == request.UserId, ct);

        if (existing is null)
        {
            db.EmergencyContacts.Add(new EmergencyContactEntity
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Name = request.Name,
                Phone = request.Phone,
                Relation = request.Relation,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            existing.Name = request.Name;
            existing.Phone = request.Phone;
            existing.Relation = request.Relation;
            existing.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}
