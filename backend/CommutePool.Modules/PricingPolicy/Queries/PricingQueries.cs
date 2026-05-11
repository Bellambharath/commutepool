using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.PricingPolicy.Queries;

public sealed record GetPricingPolicyQuery(string CorridorSlug) : IRequest<Result<PricingPolicyDto?>>;

public sealed record PricingPolicyDto(
    Guid Id,
    string CorridorSlug,
    decimal MaxContributionPerKm,
    decimal MaxDailyContribution,
    bool Active,
    DateTimeOffset UpdatedAt);
