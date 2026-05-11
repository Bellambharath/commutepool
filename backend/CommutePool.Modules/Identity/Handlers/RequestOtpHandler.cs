using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Identity.Commands;
using CommutePool.Modules.Identity.Services;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Identity.Handlers;

public sealed class RequestOtpHandler(
    CommutePoolDbContext db,
    OtpService otpService) : IRequestHandler<RequestOtpCommand, Result>
{
    public async Task<Result> Handle(RequestOtpCommand request, CancellationToken ct)
    {
        var otp = otpService.Generate();
        var hash = otpService.Hash(otp);

        db.OtpRequests.Add(new OtpRequestEntity
        {
            Id = Guid.NewGuid(),
            Phone = request.Phone,
            OtpHash = hash,
            ExpiresAt = otpService.Expiry,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync(ct);
        await otpService.SendAsync(request.Phone, otp);

        return Result.Ok();
    }
}
