using CommutePool.Infrastructure.Persistence;
using CommutePool.Modules.Identity.Commands;
using CommutePool.Modules.Identity.Dtos;
using CommutePool.Modules.Identity.Services;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Identity.Handlers;

public sealed class RefreshTokenHandler(
    CommutePoolDbContext db,
    JwtService jwtService) : IRequestHandler<RefreshTokenCommand, Result<TokenResponseDto>>
{
    public async Task<Result<TokenResponseDto>> Handle(RefreshTokenCommand request, CancellationToken ct)
    {
        // Find the session by refresh token
        var session = await db.Sessions
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.RefreshToken == request.RefreshToken
                                   && s.ExpiresAt > DateTimeOffset.UtcNow, ct);

        if (session is null)
            return Result<TokenResponseDto>.Fail("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired.");

        // Rotate refresh token (security best practice)
        var newRefreshToken = jwtService.GenerateRefreshToken();
        session.RefreshToken = newRefreshToken;
        session.ExpiresAt = jwtService.RefreshTokenExpiry;

        await db.SaveChangesAsync(ct);

        var accessToken = jwtService.GenerateAccessToken(session.User.Id, session.User.Phone);

        return Result<TokenResponseDto>.Ok(new TokenResponseDto(
            AccessToken: accessToken,
            RefreshToken: newRefreshToken));
    }
}
