using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("outbox_events")]
public sealed class OutboxEventEntity
{
    public Guid Id { get; set; }
    public string EventType { get; set; } = string.Empty;
    public int EventVersion { get; set; } = 1;
    public string AggregateType { get; set; } = string.Empty;
    public Guid AggregateId { get; set; }
    public string Payload { get; set; } = string.Empty;  // JSON
    public string Status { get; set; } = "PENDING";       // PENDING | PROCESSING | PROCESSED | DEAD
    public int Attempts { get; set; }
    public string? LastError { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

[Table("audit_logs")]
public sealed class AuditLogEntity
{
    public Guid Id { get; set; }
    public Guid? ActorId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string? TargetType { get; set; }
    public Guid? TargetId { get; set; }
    public string? Reason { get; set; }
    public string? Metadata { get; set; }  // JSON
    public DateTimeOffset CreatedAt { get; set; }
}

[Table("notifications")]
public sealed class NotificationEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string NotificationType { get; set; } = string.Empty;
    public string? Title { get; set; }
    public string? Body { get; set; }
    public string? DeepLink { get; set; }
    public bool Read { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

[Table("push_tokens")]
public sealed class PushTokenEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string Platform { get; set; } = string.Empty;
    public bool Active { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("pricing_policies")]
public sealed class PricingPolicyEntity
{
    public Guid Id { get; set; }
    public Guid? CorridorId { get; set; }
    public string Label { get; set; } = string.Empty;
    public decimal BaseContribution { get; set; }
    public decimal? MaxContribution { get; set; }
    public decimal DetourPricePerMin { get; set; }
    public bool Active { get; set; }
    public DateOnly? EffectiveFrom { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
