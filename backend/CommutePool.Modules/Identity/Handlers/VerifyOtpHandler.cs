using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Identity.Commands;
using CommutePool.Modules.Identity.Dtos;
using CommutePool.Modules.Identity.Services;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Identity.Handlers;

public sealed class VerifyOtpHandler(
    CommutePoolDbContext db,
    JwtService jwtService,
    OtpService otpService) : IRequestHandler<VerifyOtpCommand, Result<AuthResponseDto>>
{
    public async Task<Result<AuthResponseDto>> Handle(VerifyOtpCommand request, CancellationToken ct)
    {
        // Find latest valid OTP
        var otpRecord = await db.OtpRequests
            .Where(o => o.Phone == request.Phone && !o.Verified && o.ExpiresAt > DateTimeOffset.UtcNow)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync(ct);

        if (otpRecord is null || !otpService.Verify(request.Otp, otpRecord.OtpHash))
            return Result<AuthResponseDto>.Fail("INVALID_OTP", "OTP is invalid or expired.");

        // Mark OTP used
        otpRecord.Verified = true;

        // Upsert user
        var user = await db.Users.FirstOrDefaultAsync(u => u.Phone == request.Phone, ct);
        if (user is null)
        {
            user = new UserEntity
            {
                Id = Guid.NewGuid(),
                Phone = request.Phone,
                RoleMode = UserRoleMode.Rider,
                AccountStatus = AccountStatus.Active,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.Users.Add(user);
        }

        // Create session
        var refreshToken = jwtService.GenerateRefreshToken();
        db.Sessions.Add(new SessionEntity
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RefreshToken = refreshToken,
            ExpiresAt = jwtService.RefreshTokenExpiry,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync(ct);

        var accessToken = jwtService.GenerateAccessToken(user.Id, user.Phone);

        var bootstrap = new NavigationBootstrapDto(
            ProfileComplete: user.Name is not null,
            CompanyVerified: false,
            OwnerEligible: false,
            ActiveTripId: null,
            PendingMatches: 0,
            NextScreen: user.Name is null ? "onboarding" : "dashboard");

        return Result<AuthResponseDto>.Ok(new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            User: new UserSummaryDto(user.Id, user.Name, user.Phone, user.RoleMode, user.AccountStatus),
            NavigationBootstrap: bootstrap));
    }
}
