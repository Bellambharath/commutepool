using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Offer.Commands;

public sealed record CreateOfferCommand(
    Guid OwnerId,
    Guid VehicleId,
    Guid CommuteProfileId,
    TripDirection Direction,
    DateOnly OfferDate,
    TimeOnly DepartureTime,
    int AvailableSeats,
    double StartLat,
    double StartLng,
    double EndLat,
    double EndLng) : IRequest<Result<Guid>>;

public sealed record CancelOfferCommand(
    Guid OwnerId,
    Guid OfferId,
    string Reason) : IRequest<Result>;
