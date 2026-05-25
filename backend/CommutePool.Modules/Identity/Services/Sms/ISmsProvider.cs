namespace CommutePool.Modules.Identity.Services.Sms;

/// <summary>
/// Abstraction for SMS delivery. Implement this interface to add any new provider.
/// Registration is automatic via SmsProviderFactory — no other code changes needed.
/// </summary>
public interface ISmsProvider
{
    /// <summary>Unique key used in Sms__Provider config value (e.g. "msg91", "fast2sms", "console")</summary>
    string ProviderKey { get; }

    Task SendAsync(string toPhone, string message, CancellationToken ct = default);
}
