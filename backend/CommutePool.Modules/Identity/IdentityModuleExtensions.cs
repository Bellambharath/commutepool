using CommutePool.Modules.Identity.Services;
using CommutePool.Modules.Identity.Services.Sms;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules.Identity;

public static class IdentityModuleExtensions
{
    public static IServiceCollection AddIdentityModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Register ALL providers — factory picks the active one at runtime via Sms__Provider env var
        services.AddSingleton<ISmsProvider, ConsoleSmsProvider>();
        services.AddSingleton<ISmsProvider, Msg91SmsProvider>();
        services.AddSingleton<ISmsProvider, Fast2SmsSmsProvider>();

        // Factory resolves active provider from config — zero code change to switch providers
        services.AddSingleton<SmsProviderFactory>();

        services.AddSingleton<JwtService>();
        services.AddSingleton<OtpService>();

        return services;
    }
}
