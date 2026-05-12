using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.PricingPolicy.Commands;
using CommutePool.Modules.PricingPolicy.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.PricingPolicy.Handlers;

public sealed class UpsertPricingPolicyHandler(
    CommutePoolDbContext db) : IRequestHandler<UpsertPricingPolicyCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(UpsertPricingPolicyCommand req, CancellationToken ct)
    {
        var policy = await db.PricingPolicies
            .FirstOrDefaultAsync(p => p.CorridorId == req.CorridorId, ct);

        if (policy is null)
        {
            policy = new PricingPolicyEntity
            {
                Id = Guid.NewGuid(),
                CorridorId = req.CorridorId,
                Label = req.Label,
                BaseContribution = req.BaseContribution,
                MaxContribution = req.MaxContribution,
                DetourPricePerMin = req.DetourPricePerMin,
                Active = req.Active,
                EffectiveFrom = req.EffectiveFrom,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.PricingPolicies.Add(policy);
        }
        else
        {
            policy.Label = req.Label;
            policy.BaseContribution = req.BaseContribution;
            policy.MaxContribution = req.MaxContribution;
            policy.DetourPricePerMin = req.DetourPricePerMin;
            policy.Active = req.Active;
            policy.EffectiveFrom = req.EffectiveFrom;
            policy.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(policy.Id);
    }
}

public sealed class GetPricingPolicyHandler(
    CommutePoolDbContext db) : IRequestHandler<GetPricingPolicyQuery, Result<PricingPolicyDto?>>
{
    public async Task<Result<PricingPolicyDto?>> Handle(GetPricingPolicyQuery req, CancellationToken ct)
    {
        var p = await db.PricingPolicies
            .FirstOrDefaultAsync(x => x.CorridorId == req.CorridorId && x.Active, ct);

        return Result<PricingPolicyDto?>.Ok(p is null ? null : new PricingPolicyDto(
            p.Id, p.CorridorId, p.Label,
            p.BaseContribution, p.MaxContribution,
            p.DetourPricePerMin, p.Active, p.EffectiveFrom, p.UpdatedAt));
    }
}
