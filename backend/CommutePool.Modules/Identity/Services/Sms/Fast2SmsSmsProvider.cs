using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CommutePool.Modules.Identity.Services.Sms;

/// <summary>
/// Fast2SMS provider — easiest free option for India (no DLT needed for dev/quick-SMS route).
/// Required env vars:
///   Sms__Provider=fast2sms
///   Sms__Fast2Sms__ApiKey=&lt;your-api-key&gt;
///
/// Free tier: sign up at https://www.fast2sms.com — get ₹50 free credits (~250 SMS).
/// Uses the "Quick SMS" (DLT-free) route — ideal for development and testing.
/// Switch to Transactional route for production by changing RouteKey to "t".
/// </summary>
public sealed class Fast2SmsSmsProvider(
    IHttpClientFactory httpFactory,
    IConfiguration config,
    ILogger<Fast2SmsSmsProvider> logger) : ISmsProvider
{
    private const string BaseUrl = "https://www.fast2sms.com/dev/bulkV2";

    public string ProviderKey => "fast2sms";

    public async Task SendAsync(string toPhone, string message, CancellationToken ct = default)
    {
        var apiKey = config["Sms:Fast2Sms:ApiKey"] ?? throw new InvalidOperationException("Sms:Fast2Sms:ApiKey not configured");
        var route  = config["Sms:Fast2Sms:RouteKey"] ?? "q"; // "q"=Quick(dev, free), "t"=Transactional(prod)

        // Normalize to 10-digit
        var mobile = toPhone.Replace("+91", "").Replace(" ", "");

        var payload = new
        {
            authorization = apiKey,
            route         = route,
            message       = message,
            language      = "english",
            flash         = 0,
            numbers       = mobile
        };

        var http    = httpFactory.CreateClient("fast2sms");
        var json    = JsonSerializer.Serialize(payload);
        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var response = await http.PostAsync(BaseUrl, content, ct);
        var body     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            logger.LogError("[SMS:fast2sms] Failed — Status={Status} Body={Body}", response.StatusCode, body);
        else
            logger.LogInformation("[SMS:fast2sms] Sent to {Phone}", toPhone);
    }
}
