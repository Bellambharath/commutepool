using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules.Outbox;

public static class OutboxModuleExtensions
{
    public static IServiceCollection AddOutboxWorker(this IServiceCollection services)
    {
        services.AddHostedService<OutboxWorker>();
        return services;
    }
}
