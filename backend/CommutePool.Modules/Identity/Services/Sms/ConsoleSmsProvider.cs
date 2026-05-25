using Microsoft.Extensions.Logging;

namespace CommutePool.Modules.Identity.Services.Sms;

/// <summary>
/// Fallback provider: logs OTP to console. Safe for local dev — never use in production.
/// Activated when Sms__Provider=console (or when no provider is configured).
/// </summary>
public sealed class ConsoleSmsProvider(ILogger<ConsoleSmsProvider> logger) : ISmsProvider
{
    public string ProviderKey => "console";

    public Task SendAsync(string toPhone, string message, CancellationToken ct = default)
    {
        logger.LogWarning("[SMS:console] To={Phone} | Message={Message}", toPhone, message);
        return Task.CompletedTask;
    }
}
