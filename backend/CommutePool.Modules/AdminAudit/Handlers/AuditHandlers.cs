using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.AdminAudit.Commands;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.AdminAudit.Handlers;

public sealed class LogAdminActionHandler(
    CommutePoolDbContext db) : IRequestHandler<LogAdminActionCommand, Result>
{
    public async Task<Result> Handle(LogAdminActionCommand req, CancellationToken ct)
    {
        db.AdminAuditLogs.Add(new AdminAuditLogEntity
        {
            Id = Guid.NewGuid(),
            AdminUserId = req.AdminUserId,
            Action = req.Action,
            EntityType = req.EntityType,
            EntityId = req.EntityId,
            Note = req.Note,
            CreatedAt = DateTimeOffset.UtcNow
        });
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}
