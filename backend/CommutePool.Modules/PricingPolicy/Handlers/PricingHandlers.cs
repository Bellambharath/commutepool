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
            .FirstOrDefaultAsync(p => p.CorridorSlug == req.CorridorSlug, ct);

        if (policy is null)
        {
            policy = new PricingPolicyEntity
            {
                Id = Guid.NewGuid(),
                CorridorSlug = req.CorridorSlug,
                MaxContributionPerKm = req.MaxContributionPerKm,
                MaxDailyContribution = req.MaxDailyContribution,
                Active = req.Active,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.PricingPolicies.Add(policy);
        }
        else
        {
            policy.MaxContributionPerKm = req.MaxContributionPerKm;
            policy.MaxDailyContribution = req.MaxDailyContribution;
            policy.Active = req.Active;
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
            .FirstOrDefaultAsync(x => x.CorridorSlug == req.CorridorSlug && x.Active, ct);

        return Result<PricingPolicyDto?>.Ok(p is null ? null : new PricingPolicyDto(
            p.Id, p.CorridorSlug, p.MaxContributionPerKm,
            p.MaxDailyContribution, p.Active, p.UpdatedAt));
    }
}
