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
        services.AddHttpClient("msg91");
        services.AddHttpClient("fast2sms");

        // Register ALL providers — factory picks the active one at runtime via Sms__Provider config
        services.AddSingleton<ISmsProvider, ConsoleSmsProvider>();
        services.AddSingleton<ISmsProvider, Msg91SmsProvider>();
        services.AddSingleton<ISmsProvider, Fast2SmsSmsProvider>();

        // Factory resolves active provider from config — no code change to switch
        services.AddSingleton<SmsProviderFactory>();

        services.AddSingleton<JwtService>();
        services.AddSingleton<OtpService>();

        return services;
    }
}
