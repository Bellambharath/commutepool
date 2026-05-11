using CommutePool.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Outbox;

public sealed class OutboxWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OutboxWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Outbox worker started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<CommutePoolDbContext>();

                var pending = await db.OutboxEvents
                    .Where(e => e.Status == "PENDING")
                    .OrderBy(e => e.CreatedAt)
                    .Take(20)
                    .ToListAsync(stoppingToken);

                foreach (var ev in pending)
                {
                    try
                    {
                        // TODO: route to FCM / email / SMS based on ev.EventType
                        logger.LogInformation("Processing outbox event {Id} of type {Type}", ev.Id, ev.EventType);

                        ev.Status = "PROCESSED";
                        ev.ProcessedAt = DateTimeOffset.UtcNow;
                        ev.UpdatedAt = DateTimeOffset.UtcNow;
                    }
                    catch (Exception ex)
                    {
                        ev.Status = "FAILED";
                        ev.LastError = ex.Message;
                        ev.UpdatedAt = DateTimeOffset.UtcNow;
                        logger.LogError(ex, "Failed to process outbox event {Id}", ev.Id);
                    }
                }

                if (pending.Count > 0)
                    await db.SaveChangesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Outbox worker error.");
            }

            await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);
        }
    }
}

public static class OutboxWorkerExtensions
{
    public static IServiceCollection AddOutboxWorker(this IServiceCollection services)
    {
        services.AddHostedService<OutboxWorker>();
        return services;
    }
}
