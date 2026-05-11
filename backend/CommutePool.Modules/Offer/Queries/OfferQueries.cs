using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Offer.Queries;

public sealed record GetMyOffersQuery(
    Guid OwnerId,
    int Page,
    int PageSize) : IRequest<Result<List<OfferDto>>>;

public sealed record GetOfferDetailQuery(Guid OfferId) : IRequest<Result<OfferDto>>;

public sealed record GetAvailableOffersForRiderQuery(
    Guid RiderId,
    Guid CorridorId,
    DateOnly Date) : IRequest<Result<List<OfferDto>>>;

public sealed record OfferDto(
    Guid Id,
    Guid OwnerId,
    string OwnerName,
    Guid VehicleId,
    string VehicleRegistrationNo,
    string Direction,
    DateOnly OfferDate,
    string DepartureTime,
    int AvailableSeats,
    int AcceptedSeats,
    double StartLat,
    double StartLng,
    double EndLat,
    double EndLng,
    string Status,
    DateTimeOffset CreatedAt);
