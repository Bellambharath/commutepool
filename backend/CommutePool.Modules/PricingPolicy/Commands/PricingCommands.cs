using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.PricingPolicy.Commands;

public sealed record UpsertPricingPolicyCommand(
    Guid AdminUserId,
    Guid CorridorId,
    string Label,
    decimal BaseContribution,
    decimal MaxContribution,
    decimal DetourPricePerMin,
    bool Active,
    DateTimeOffset EffectiveFrom) : IRequest<Result<Guid>>;
