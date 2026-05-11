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
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(ModulesServiceExtensions).Assembly));

        services.AddIdentityModule(configuration);
        services.AddUserProfileModule();
        services.AddVerificationModule();
        services.AddOutboxWorker();

        return services;
    }
}
