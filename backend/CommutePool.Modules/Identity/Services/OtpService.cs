using CommutePool.Modules.Identity.Services.Sms;
using Microsoft.Extensions.Configuration;

namespace CommutePool.Modules.Identity.Services;

/// <summary>
/// Generates, hashes, verifies OTPs and delegates SMS delivery to the active ISmsProvider.
/// To switch SMS provider: change Sms__Provider env var — no code change required.
/// </summary>
public sealed class OtpService(
    IConfiguration configuration,
    SmsProviderFactory smsFactory)
{
    private readonly int _length        = int.Parse(configuration["Otp:Length"]        ?? "6");
    private readonly int _expiryMinutes = int.Parse(configuration["Otp:ExpiryMinutes"] ?? "5");

    public string Generate()
    {
        var rng = new Random();
        return string.Concat(Enumerable.Range(0, _length).Select(_ => rng.Next(0, 10).ToString()));
    }

    public string Hash(string otp)   => BCrypt.Net.BCrypt.HashPassword(otp);
    public bool   Verify(string otp, string hash) => BCrypt.Net.BCrypt.Verify(otp, hash);
    public DateTimeOffset Expiry     => DateTimeOffset.UtcNow.AddMinutes(_expiryMinutes);

    public Task SendAsync(string phone, string otp, CancellationToken ct = default)
    {
        var message  = $"Your CommutePool OTP is {otp}. Valid for {_expiryMinutes} minutes. Do not share it with anyone.";
        var provider = smsFactory.Resolve();
        return provider.SendAsync(phone, message, ct);
    }
}
