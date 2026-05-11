using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.PricingPolicy.Commands;

public sealed record UpsertPricingPolicyCommand(
    Guid AdminUserId,
    string CorridorSlug,
    decimal MaxContributionPerKm,
    decimal MaxDailyContribution,
    bool Active) : IRequest<Result<Guid>>;
