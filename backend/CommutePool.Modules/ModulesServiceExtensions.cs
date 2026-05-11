using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules;

public static class ModulesServiceExtensions
{
    public static IServiceCollection AddModules(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register all MediatR handlers from this assembly
        services.AddMediatR(cfg =>
            cfg.RegisterServicesFromAssembly(typeof(ModulesServiceExtensions).Assembly));

        // Register module-specific services
        services.AddIdentityModule(configuration);
        services.AddUserProfileModule();
        services.AddVerificationModule();
        services.AddOutboxWorker();

        return services;
    }
}
