using CommutePool.Infrastructure.Persistence;
using CommutePool.Modules.UserProfile.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.UserProfile.Handlers;

public sealed class GetMyProfileHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyProfileQuery, Result<UserProfileDto>>
{
    public async Task<Result<UserProfileDto>> Handle(GetMyProfileQuery request, CancellationToken ct)
    {
        var user = await db.Users
            .Include(u => u.EmergencyContact)
            .Include(u => u.TrustScore)
            .FirstOrDefaultAsync(u => u.Id == request.UserId, ct);

        if (user is null)
            return Result<UserProfileDto>.Fail("USER_NOT_FOUND", "User not found.");

        return Result<UserProfileDto>.Ok(new UserProfileDto(
            Id: user.Id,
            Name: user.Name,
            Phone: user.Phone,
            Email: user.Email,
            RoleMode: user.RoleMode.ToString(),
            AccountStatus: user.AccountStatus.ToString(),
            TrustScore: user.TrustScore?.Score,
            EmergencyContact: user.EmergencyContact is null ? null : new EmergencyContactDto(
                user.EmergencyContact.Id,
                user.EmergencyContact.Name,
                user.EmergencyContact.Phone,
                user.EmergencyContact.Relation)));
    }
}
