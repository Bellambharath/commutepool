using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Offer.Queries;

public sealed record GetMyOffersQuery(
    Guid OwnerId,
    int Page = 1,
    int PageSize = 20) : IRequest<Result<List<OfferDto>>>;

public sealed record GetOfferDetailQuery(
    Guid OfferId) : IRequest<Result<OfferDto>>;

public sealed record GetAvailableOffersForRiderQuery(
    Guid RiderId) : IRequest<Result<List<OfferDto>>>;

public sealed record OfferDto(
    Guid Id,
    Guid OwnerId,
    Guid VehicleId,
    int AvailableSeats,
    string Status,
    DateTimeOffset CreatedAt);
