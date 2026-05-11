using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Analytics.Queries;

public sealed record GetTripMetricsQuery(
    DateOnly From,
    DateOnly To) : IRequest<Result<TripMetricsDto>>;

public sealed record GetFunnelMetricsQuery(
    DateOnly From,
    DateOnly To) : IRequest<Result<FunnelMetricsDto>>;

public sealed record TripMetricsDto(
    int TotalTrips,
    int CompletedTrips,
    int CancelledTrips,
    int NoShowTrips,
    double CompletionRate);

public sealed record FunnelMetricsDto(
    int TotalUsers,
    int VerifiedUsers,
    int UsersWithCommuteProfile,
    int UsersWhoMadeOffer,
    int UsersWhoMadeRequest,
    int UsersWhoCompletedTrip);
