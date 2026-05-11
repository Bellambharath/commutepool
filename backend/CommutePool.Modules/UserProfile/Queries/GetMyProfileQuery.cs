using CommutePool.Modules.Identity.Dtos;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.UserProfile.Queries;

public sealed record GetMyProfileQuery(Guid UserId) : IRequest<Result<UserProfileDto>>;

public sealed record UserProfileDto(
    Guid Id,
    string? Name,
    string Phone,
    string? Email,
    string RoleMode,
    string AccountStatus,
    decimal? TrustScore,
    EmergencyContactDto? EmergencyContact);

public sealed record EmergencyContactDto(
    Guid Id,
    string Name,
    string Phone,
    string? Relation);
