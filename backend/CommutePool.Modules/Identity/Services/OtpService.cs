using Microsoft.Extensions.Configuration;

namespace CommutePool.Modules.Identity.Services;

public sealed class OtpService(IConfiguration configuration)
{
    private readonly int _length = int.Parse(configuration["Otp:Length"] ?? "6");
    private readonly int _expiryMinutes = int.Parse(configuration["Otp:ExpiryMinutes"] ?? "5");

    public string Generate()
    {
        var rng = new Random();
        return string.Concat(Enumerable.Range(0, _length).Select(_ => rng.Next(0, 10).ToString()));
    }

    public string Hash(string otp) => BCrypt.Net.BCrypt.HashPassword(otp);

    public bool Verify(string otp, string hash) => BCrypt.Net.BCrypt.Verify(otp, hash);

    public DateTimeOffset Expiry => DateTimeOffset.UtcNow.AddMinutes(_expiryMinutes);

    // TODO: Replace with real SMS provider (Twilio, MSG91, etc.)
    public Task SendAsync(string phone, string otp)
    {
        Console.WriteLine($"[DEV] OTP for {phone}: {otp}");
        return Task.CompletedTask;
    }
}
