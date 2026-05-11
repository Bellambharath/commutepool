using CommutePool.Shared.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("match_candidates")]
public sealed class MatchCandidateEntity
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public Guid RequestId { get; set; }
    public Guid CorridorId { get; set; }
    public decimal? Score { get; set; }
    public MatchStatus Status { get; set; } = MatchStatus.Proposed;
    public string? OwnerAction { get; set; }
    public string? RiderAction { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("trips")]
public sealed class TripEntity
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Guid OwnerId { get; set; }
    public Guid RiderId { get; set; }
    public Guid CorridorId { get; set; }
    public Guid? PickupOptionId { get; set; }
    public TripStatus Status { get; set; } = TripStatus.Scheduled;
    public DateTimeOffset? ScheduledAt { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public string? CancelReason { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("trip_checkpoints")]
public sealed class TripCheckpointEntity
{
    public Guid Id { get; set; }
    public Guid TripId { get; set; }
    public string Checkpoint { get; set; } = string.Empty;
    public string? Geo { get; set; }
    public DateTimeOffset RecordedAt { get; set; }
}
