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
        var corridor = await db.Corridors
            .FirstOrDefaultAsync(c => c.Slug == req.CorridorSlug, ct);
        if (corridor is null)
            return Result<Guid>.Fail("INVALID_CORRIDOR", "Corridor not found.");

        var policy = await db.PricingPolicies
            .FirstOrDefaultAsync(p => p.CorridorId == corridor.Id, ct);

        if (policy is null)
        {
            policy = new PricingPolicyEntity
            {
                Id = Guid.NewGuid(),
                CorridorId = corridor.Id,
                Label = req.Label,
                BaseContribution = req.BaseContribution,   // MaxContributionPerKm in DTO
                MaxContribution = req.MaxContribution,     // MaxDailyContribution in DTO
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
            .Include(x => x.Corridor)
            .FirstOrDefaultAsync(x => x.Corridor != null && x.Corridor.Slug == req.CorridorSlug && x.Active, ct);

        if (p is null) return Result<PricingPolicyDto?>.Ok(null);

        return Result<PricingPolicyDto?>.Ok(new PricingPolicyDto(
            p.Id,
            p.Corridor!.Slug,
            p.BaseContribution,           // -> MaxContributionPerKm
            p.MaxContribution ?? 0m,      // -> MaxDailyContribution
            p.Active,
            p.UpdatedAt));
    }
}
