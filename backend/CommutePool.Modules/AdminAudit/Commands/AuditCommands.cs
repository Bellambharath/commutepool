using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.AdminAudit.Commands;

public sealed record LogAdminActionCommand(
    Guid AdminUserId,
    string Action,
    string EntityType,
    Guid EntityId,
    string? Note) : IRequest<Result>;
