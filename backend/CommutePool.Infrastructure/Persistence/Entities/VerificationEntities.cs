using CommutePool.Shared.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("emergency_contacts")]
public sealed class EmergencyContactEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Relation { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public UserEntity User { get; set; } = null!;
}

[Table("companies")]
public sealed class CompanyEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string EmailDomain { get; set; } = string.Empty;
    public bool EnterpriseMode { get; set; }
    public bool Active { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("user_company_memberships")]
public sealed class UserCompanyMembershipEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CompanyId { get; set; }
    public string WorkEmail { get; set; } = string.Empty;
    public bool Verified { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("verification_cases")]
public sealed class VerificationCaseEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public VerificationDocumentType DocumentType { get; set; }
    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;
    public string? ArtifactUrl { get; set; }
    public string? RejectionReason { get; set; }
    public Guid? ReviewerId { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public UserEntity User { get; set; } = null!;
}

[Table("owner_eligibility")]
public sealed class OwnerEligibilityEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public OwnerEligibilityStatus Status { get; set; } = OwnerEligibilityStatus.NotEligible;
    public DateTimeOffset LastEvaluatedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
