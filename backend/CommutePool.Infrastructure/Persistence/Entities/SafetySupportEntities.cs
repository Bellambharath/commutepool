using CommutePool.Shared.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("incidents")]
public sealed class IncidentEntity
{
    public Guid Id { get; set; }
    public Guid? TripId { get; set; }
    public Guid ReporterId { get; set; }
    public IncidentType IncidentType { get; set; }
    public IncidentSeverity Severity { get; set; } = IncidentSeverity.Medium;
    public IncidentStatus Status { get; set; } = IncidentStatus.Open;
    public string? Description { get; set; }
    public Guid? AssigneeId { get; set; }
    public string? ResolutionNote { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("support_tickets")]
public sealed class SupportTicketEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? TripId { get; set; }
    public Guid? IncidentId { get; set; }
    public string Subject { get; set; } = string.Empty;
    public string? Category { get; set; }
    public SupportTicketStatus Status { get; set; } = SupportTicketStatus.Open;
    public SupportTicketPriority Priority { get; set; } = SupportTicketPriority.Normal;
    public Guid? AssigneeId { get; set; }
    public DateTimeOffset? ResolvedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("support_ticket_messages")]
public sealed class SupportTicketMessageEntity
{
    public Guid Id { get; set; }
    public Guid TicketId { get; set; }
    public Guid SenderId { get; set; }
    public string Body { get; set; } = string.Empty;
    public DateTimeOffset CreatedAt { get; set; }
}
