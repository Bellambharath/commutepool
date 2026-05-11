using CommutePool.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace CommutePool.Modules.Outbox;

/// <summary>
/// Polls outbox_events table and processes PENDING events.
/// Runs every 5 seconds in the background.
/// </summary>
public sealed class OutboxWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingEventsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Outbox worker error");
            }

            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }
    }

    private async Task ProcessPendingEventsAsync(CancellationToken ct)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CommutePoolDbContext>();

        var events = await db.OutboxEvents
            .Where(e => e.Status == "PENDING" && e.Attempts < 5)
            .OrderBy(e => e.CreatedAt)
            .Take(20)
            .ToListAsync(ct);

        foreach (var evt in events)
        {
            evt.Status = "PROCESSING";
            evt.Attempts++;
            await db.SaveChangesAsync(ct);

            try
            {
                // TODO: Route to event handlers by EventType
                // e.g. switch(evt.EventType) { case "TripStarted": ... }
                logger.LogInformation("Processing outbox event {EventType} {AggregateId}",
                    evt.EventType, evt.AggregateId);

                evt.Status = "PROCESSED";
                evt.ProcessedAt = DateTimeOffset.UtcNow;
            }
            catch (Exception ex)
            {
                evt.Status = evt.Attempts >= 5 ? "DEAD" : "PENDING";
                evt.LastError = ex.Message;
                logger.LogWarning(ex, "Outbox event {Id} failed (attempt {Attempts})",
                    evt.Id, evt.Attempts);
            }

            await db.SaveChangesAsync(ct);
        }
    }
}
