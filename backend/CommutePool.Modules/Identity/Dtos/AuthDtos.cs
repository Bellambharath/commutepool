using CommutePool.Shared.Enums;

namespace CommutePool.Modules.Identity.Dtos;

public sealed record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    UserSummaryDto User,
    NavigationBootstrapDto NavigationBootstrap);

public sealed record TokenResponseDto(
    string AccessToken,
    string RefreshToken);

public sealed record UserSummaryDto(
    Guid Id,
    string? Name,
    string Phone,
    UserRoleMode RoleMode,
    AccountStatus AccountStatus);

public sealed record NavigationBootstrapDto(
    bool ProfileComplete,
    bool CompanyVerified,
    bool OwnerEligible,
    Guid? ActiveTripId,
    int PendingMatches,
    string NextScreen);
