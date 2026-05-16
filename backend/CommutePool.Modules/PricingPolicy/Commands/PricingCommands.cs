using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.PricingPolicy.Commands;

public sealed record UpsertPricingPolicyCommand(
    Guid AdminUserId,
    string CorridorSlug,
    string Label,
    decimal BaseContribution,
    decimal MaxContribution,
    decimal DetourPricePerMin,
    bool Active,
    DateOnly EffectiveFrom) : IRequest<Result<Guid>>;
