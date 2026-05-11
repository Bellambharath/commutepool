using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Trip.Commands;

public sealed record StartTripCommand(
    Guid MatchId,
    Guid InitiatedByUserId) : IRequest<Result<Guid>>;

public sealed record CompleteTripCommand(
    Guid TripId,
    Guid InitiatedByUserId) : IRequest<Result>;

public sealed record CancelTripCommand(
    Guid TripId,
    Guid InitiatedByUserId,
    string Reason) : IRequest<Result>;

public sealed record MarkNoShowCommand(
    Guid TripId,
    Guid ReportedByUserId) : IRequest<Result>;
