using CommutePool.Modules.Identity;
using CommutePool.Modules.Outbox;
using CommutePool.Modules.UserProfile;
using CommutePool.Modules.Verification;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules;

public static class ModulesServiceExtensions
{
    public static IServiceCollection AddModules(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // MediatR scans entire Modules assembly — all handlers auto-registered
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(ModulesServiceExtensions).Assembly));

        services.AddIdentityModule(configuration);
        services.AddUserProfileModule();
        services.AddVerificationModule();
        services.AddOutboxWorker();
        // Corridor, Commute, Offer, Vehicle handlers auto-picked up by MediatR scan

        return services;
    }
}
