using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("otp_requests")]
public sealed class OtpRequestEntity
{
    public Guid Id { get; set; }
    public string Phone { get; set; } = string.Empty;
    public string OtpHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public bool Verified { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

[Table("sessions")]
public sealed class SessionEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string RefreshToken { get; set; } = string.Empty;
    public string? DeviceInfo { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public bool Revoked { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public UserEntity User { get; set; } = null!;
}
