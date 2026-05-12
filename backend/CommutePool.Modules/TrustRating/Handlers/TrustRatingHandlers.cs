using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.TrustRating.Commands;
using CommutePool.Modules.TrustRating.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.TrustRating.Handlers;

public sealed class SubmitRatingHandler(
    CommutePoolDbContext db,
    IMediator mediator) : IRequestHandler<SubmitRatingCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(SubmitRatingCommand req, CancellationToken ct)
    {
        if (req.Stars is < 1 or > 5)
            return Result<Guid>.Fail("INVALID_STARS", "Stars must be between 1 and 5.");

        var trip = await db.Trips.FindAsync([req.TripId], ct);
        if (trip is null) return Result<Guid>.Fail("NOT_FOUND", "Trip not found.");

        if (trip.OwnerId != req.RaterUserId && trip.RiderId != req.RaterUserId)
            return Result<Guid>.Fail("FORBIDDEN", "Not a participant of this trip.");

        if (trip.OwnerId != req.RatedUserId && trip.RiderId != req.RatedUserId)
            return Result<Guid>.Fail("INVALID_TARGET", "Rated user is not a participant of this trip.");

        if (req.RaterUserId == req.RatedUserId)
            return Result<Guid>.Fail("SELF_RATING", "Cannot rate yourself.");

        var duplicate = await db.Ratings.AnyAsync(
            r => r.TripId == req.TripId && r.RaterUserId == req.RaterUserId, ct);
        if (duplicate) return Result<Guid>.Fail("ALREADY_RATED", "You have already rated this trip.");

        var rating = new RatingEntity
        {
            Id = Guid.NewGuid(),
            TripId = req.TripId,
            RaterUserId = req.RaterUserId,
            RatedUserId = req.RatedUserId,
            Stars = req.Stars,
            Comment = req.Comment,
            CreatedAt = DateTimeOffset.UtcNow
        };

        db.Ratings.Add(rating);
        await db.SaveChangesAsync(ct);

        await mediator.Send(new RecomputeTrustScoreCommand(req.RatedUserId), ct);
        return Result<Guid>.Ok(rating.Id);
    }
}

public sealed class RecomputeTrustScoreHandler(
    CommutePoolDbContext db) : IRequestHandler<RecomputeTrustScoreCommand, Result<double>>
{
    public async Task<Result<double>> Handle(RecomputeTrustScoreCommand req, CancellationToken ct)
    {
        var ratings = await db.Ratings
            .Where(r => r.RatedUserId == req.UserId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(ct);

        if (ratings.Count == 0)
            return Result<double>.Ok(0.0);

        // Weighted: recent ratings (first 20) count 2x
        double weightedSum = 0;
        double totalWeight = 0;

        for (int i = 0; i < ratings.Count; i++)
        {
            double weight = i < 20 ? 2.0 : 1.0;
            weightedSum += ratings[i].Stars * weight;
            totalWeight += weight;
        }

        var score = Math.Round(Math.Min(weightedSum / totalWeight, 5.0), 2);

        var trustScore = await db.TrustScores.FirstOrDefaultAsync(s => s.UserId == req.UserId, ct);
        if (trustScore is null)
        {
            trustScore = new TrustScoreEntity
            {
                Id = Guid.NewGuid(),
                UserId = req.UserId,
                Score = (decimal)score,
                TotalRatings = ratings.Count,
                UpdatedAt = DateTimeOffset.UtcNow
            };
            db.TrustScores.Add(trustScore);
        }
        else
        {
            trustScore.Score = (decimal)score;
            trustScore.TotalRatings = ratings.Count;
            trustScore.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result<double>.Ok(score);
    }
}

public sealed class GetUserTrustScoreHandler(
    CommutePoolDbContext db) : IRequestHandler<GetUserTrustScoreQuery, Result<TrustScoreDto>>
{
    public async Task<Result<TrustScoreDto>> Handle(GetUserTrustScoreQuery req, CancellationToken ct)
    {
        var trustScore = await db.TrustScores
            .FirstOrDefaultAsync(s => s.UserId == req.UserId, ct);

        var score = trustScore is not null ? (double)trustScore.Score : 0.0;
        var totalRatings = trustScore?.TotalRatings ?? 0;
        var updatedAt = trustScore?.UpdatedAt ?? DateTimeOffset.MinValue;

        return Result<TrustScoreDto>.Ok(new TrustScoreDto(
            req.UserId,
            score,
            totalRatings,
            updatedAt));
    }
}

public sealed class GetMyRatingsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyRatingsQuery, Result<List<RatingDto>>>
{
    public async Task<Result<List<RatingDto>>> Handle(GetMyRatingsQuery req, CancellationToken ct)
    {
        var ratings = await db.Ratings
            .Include(r => r.Rater)
            .Where(r => r.RatedUserId == req.UserId)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(r => new RatingDto(
                r.Id, r.TripId, r.RaterUserId,
                r.Rater.Name ?? string.Empty,
                r.Stars, r.Comment, r.CreatedAt))
            .ToListAsync(ct);

        return Result<List<RatingDto>>.Ok(ratings);
    }
}
