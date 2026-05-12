using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.SupportGrievance.Commands;
using CommutePool.Modules.SupportGrievance.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.SupportGrievance.Handlers;

public sealed class RaiseTicketHandler(
    CommutePoolDbContext db) : IRequestHandler<RaiseTicketCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(RaiseTicketCommand req, CancellationToken ct)
    {
        var ticket = new SupportTicketEntity
        {
            Id = Guid.NewGuid(),
            UserId = req.UserId,
            Category = req.Category.ToString(),
            Subject = req.Subject,
            Status = SupportTicketStatus.Open,
            TripId = req.TripId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.SupportTickets.Add(ticket);

        // First message = initial body
        db.SupportTicketMessages.Add(new SupportTicketMessageEntity
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = req.UserId,
            Body = req.Body,
            CreatedAt = DateTimeOffset.UtcNow
        });

        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(ticket.Id);
    }
}

public sealed class AddTicketMessageHandler(
    CommutePoolDbContext db) : IRequestHandler<AddTicketMessageCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(AddTicketMessageCommand req, CancellationToken ct)
    {
        var ticket = await db.SupportTickets.FindAsync([req.TicketId], ct);
        if (ticket is null) return Result<Guid>.Fail("NOT_FOUND", "Ticket not found.");
        if (ticket.UserId != req.UserId && ticket.AssigneeId != req.UserId)
            return Result<Guid>.Fail("FORBIDDEN", "Not a participant of this ticket.");
        if (ticket.Status == SupportTicketStatus.Closed || ticket.Status == SupportTicketStatus.Resolved)
            return Result<Guid>.Fail("TICKET_CLOSED", "Cannot add message to a closed ticket.");

        var msg = new SupportTicketMessageEntity
        {
            Id = Guid.NewGuid(),
            TicketId = req.TicketId,
            SenderId = req.UserId,
            Body = req.Message,
            CreatedAt = DateTimeOffset.UtcNow
        };
        db.SupportTicketMessages.Add(msg);
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(msg.Id);
    }
}

public sealed class CloseTicketHandler(
    CommutePoolDbContext db) : IRequestHandler<CloseTicketCommand, Result>
{
    public async Task<Result> Handle(CloseTicketCommand req, CancellationToken ct)
    {
        var ticket = await db.SupportTickets.FindAsync([req.TicketId], ct);
        if (ticket is null) return Result.Fail("NOT_FOUND", "Ticket not found.");
        if (ticket.UserId != req.UserId) return Result.Fail("FORBIDDEN", "Not your ticket.");
        ticket.Status = SupportTicketStatus.Closed;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class AssignTicketHandler(
    CommutePoolDbContext db) : IRequestHandler<AssignTicketCommand, Result>
{
    public async Task<Result> Handle(AssignTicketCommand req, CancellationToken ct)
    {
        var ticket = await db.SupportTickets.FindAsync([req.TicketId], ct);
        if (ticket is null) return Result.Fail("NOT_FOUND", "Ticket not found.");
        ticket.AssigneeId = req.AdminUserId;
        ticket.Status = SupportTicketStatus.InProgress;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class ResolveTicketHandler(
    CommutePoolDbContext db) : IRequestHandler<ResolveTicketCommand, Result>
{
    public async Task<Result> Handle(ResolveTicketCommand req, CancellationToken ct)
    {
        var ticket = await db.SupportTickets.FindAsync([req.TicketId], ct);
        if (ticket is null) return Result.Fail("NOT_FOUND", "Ticket not found.");
        ticket.Status = SupportTicketStatus.Resolved;
        ticket.ResolvedAt = DateTimeOffset.UtcNow;
        ticket.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetMyTicketsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetMyTicketsQuery, Result<List<TicketDto>>>
{
    public async Task<Result<List<TicketDto>>> Handle(GetMyTicketsQuery req, CancellationToken ct)
    {
        var list = await db.SupportTickets
            .Where(t => t.UserId == req.UserId)
            .OrderByDescending(t => t.UpdatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(t => new TicketDto(t.Id, t.Category ?? string.Empty, t.Subject,
                t.Status.ToString(), t.AssigneeId, t.CreatedAt, t.UpdatedAt))
            .ToListAsync(ct);
        return Result<List<TicketDto>>.Ok(list);
    }
}

public sealed class GetTicketDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetTicketDetailQuery, Result<TicketDetailDto>>
{
    public async Task<Result<TicketDetailDto>> Handle(GetTicketDetailQuery req, CancellationToken ct)
    {
        var ticket = await db.SupportTickets
            .Include(t => t.SupportTicketMessages)
            .FirstOrDefaultAsync(t => t.Id == req.TicketId, ct);

        if (ticket is null) return Result<TicketDetailDto>.Fail("NOT_FOUND", "Ticket not found.");
        if (ticket.UserId != req.RequestingUserId && ticket.AssigneeId != req.RequestingUserId)
            return Result<TicketDetailDto>.Fail("FORBIDDEN", "Not a participant of this ticket.");

        return Result<TicketDetailDto>.Ok(new TicketDetailDto(
            ticket.Id, ticket.UserId,
            ticket.Category ?? string.Empty, ticket.Subject,
            ticket.Status.ToString(), ticket.ResolvedAt?.ToString(),
            ticket.TripId,
            ticket.SupportTicketMessages
                .OrderBy(m => m.CreatedAt)
                .Select(m => new TicketMessageDto(
                    m.Id, m.SenderId,
                    string.Empty,
                    m.Body, m.CreatedAt))
                .ToList(),
            ticket.CreatedAt));
    }
}

public sealed class GetAllTicketsAdminHandler(
    CommutePoolDbContext db) : IRequestHandler<GetAllTicketsAdminQuery, Result<List<TicketDto>>>
{
    public async Task<Result<List<TicketDto>>> Handle(GetAllTicketsAdminQuery req, CancellationToken ct)
    {
        var query = db.SupportTickets.AsQueryable();
        if (!string.IsNullOrWhiteSpace(req.Status) &&
            Enum.TryParse<SupportTicketStatus>(req.Status, true, out var statusFilter))
            query = query.Where(t => t.Status == statusFilter);

        var list = await query
            .OrderByDescending(t => t.UpdatedAt)
            .Skip((req.Page - 1) * req.PageSize)
            .Take(req.PageSize)
            .Select(t => new TicketDto(t.Id, t.Category ?? string.Empty, t.Subject,
                t.Status.ToString(), t.AssigneeId, t.CreatedAt, t.UpdatedAt))
            .ToListAsync(ct);
        return Result<List<TicketDto>>.Ok(list);
    }
}
