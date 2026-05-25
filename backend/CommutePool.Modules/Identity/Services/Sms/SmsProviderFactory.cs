using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CommutePool.Modules.Identity.Services.Sms;

/// <summary>
/// Resolves the active ISmsProvider at runtime based on Sms__Provider config value.
/// To add a new provider: implement ISmsProvider, register it in DI — factory picks it up automatically.
/// </summary>
public sealed class SmsProviderFactory(
    IEnumerable<ISmsProvider> providers,
    IConfiguration config,
    ILogger<SmsProviderFactory> logger)
{
    public ISmsProvider Resolve()
    {
        var key = (config["Sms:Provider"] ?? "console").ToLowerInvariant();

        var provider = providers.FirstOrDefault(p =>
            p.ProviderKey.Equals(key, StringComparison.OrdinalIgnoreCase));

        if (provider is null)
        {
            logger.LogWarning("[SMS] Provider '{Key}' not found — falling back to console", key);
            provider = providers.First(p => p.ProviderKey == "console");
        }

        return provider;
    }
}
