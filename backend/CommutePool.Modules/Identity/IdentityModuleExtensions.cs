using CommutePool.Modules.Identity.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules.Identity;

public static class IdentityModuleExtensions
{
    public static IServiceCollection AddIdentityModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton<JwtService>();
        services.AddSingleton<OtpService>();
        return services;
    }
}
