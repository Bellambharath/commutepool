using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

// Replace placeholder with full entity including Company navigation
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

    // Navigation
    public CompanyEntity Company { get; set; } = null!;
    public UserEntity User { get; set; } = null!;
}
