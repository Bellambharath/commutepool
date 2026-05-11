using CommutePool.Shared.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("users")]
public sealed class UserEntity
{
    public Guid Id { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string? Name { get; set; }
    public string? Email { get; set; }
    public UserRoleMode RoleMode { get; set; } = UserRoleMode.Rider;
    public AccountStatus AccountStatus { get; set; } = AccountStatus.Active;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    // Navigation
    public EmergencyContactEntity? EmergencyContact { get; set; }
    public TrustScoreEntity? TrustScore { get; set; }
    public ICollection<SessionEntity> Sessions { get; set; } = [];
    public ICollection<VerificationCaseEntity> VerificationCases { get; set; } = [];
    public ICollection<CommuteProfileEntity> CommuteProfiles { get; set; } = [];
}
