using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.UserProfile.Commands;

public sealed record UpdateProfileCommand(
    Guid UserId,
    string Name,
    string? Email) : IRequest<Result>;

public sealed record UpdateEmergencyContactCommand(
    Guid UserId,
    string Name,
    string Phone,
    string? Relation) : IRequest<Result>;
