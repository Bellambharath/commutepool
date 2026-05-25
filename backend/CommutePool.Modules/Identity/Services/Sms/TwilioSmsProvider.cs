using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CommutePool.Modules.Identity.Services.Sms;

/// <summary>
/// Twilio SMS provider.
/// Required env vars:
///   Sms__Provider=twilio
///   Sms__Twilio__AccountSid=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
///   Sms__Twilio__AuthToken=your_auth_token
///   Sms__Twilio__From=+1xxxxxxxxxx   (your Twilio phone number)
/// </summary>
public sealed class TwilioSmsProvider(
    IConfiguration config,
    ILogger<TwilioSmsProvider> logger) : ISmsProvider
{
    private static readonly HttpClient _http = new();

    public string ProviderKey => "twilio";

    public async Task SendAsync(string toPhone, string message, CancellationToken ct = default)
    {
        var accountSid = config["Sms:Twilio:AccountSid"] ?? throw new InvalidOperationException("Sms:Twilio:AccountSid not configured");
        var authToken  = config["Sms:Twilio:AuthToken"]  ?? throw new InvalidOperationException("Sms:Twilio:AuthToken not configured");
        var from       = config["Sms:Twilio:From"]       ?? throw new InvalidOperationException("Sms:Twilio:From not configured");

        var url = $"https://api.twilio.com/2010-04-01/Accounts/{accountSid}/Messages.json";

        // Twilio uses Basic Auth: Base64(AccountSid:AuthToken)
        var credentials = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{accountSid}:{authToken}"));

        var formData = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["To"]   = toPhone,
            ["From"] = from,
            ["Body"] = message
        });

        var request = new HttpRequestMessage(HttpMethod.Post, url) { Content = formData };
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);

        var response = await _http.SendAsync(request, ct);
        var body     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            logger.LogError("[SMS:twilio] Failed — Status={Status} Body={Body}", response.StatusCode, body);
        else
            logger.LogInformation("[SMS:twilio] Sent to {Phone}", toPhone);
    }
}
