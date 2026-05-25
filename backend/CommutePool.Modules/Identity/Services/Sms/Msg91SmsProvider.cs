using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace CommutePool.Modules.Identity.Services.Sms;

/// <summary>
/// MSG91 SMS provider.
/// Required env vars:
///   Sms__Provider=msg91
///   Sms__Msg91__AuthKey=&lt;your-auth-key&gt;
///   Sms__Msg91__SenderId=&lt;6-char sender id&gt;   (e.g. CPOOL)
///   Sms__Msg91__TemplateId=&lt;DLT template id&gt;  (from MSG91 dashboard)
///
/// Free trial: sign up at https://msg91.com — get ~100 free SMS credits.
/// </summary>
public sealed class Msg91SmsProvider(
    IConfiguration config,
    ILogger<Msg91SmsProvider> logger) : ISmsProvider
{
    private static readonly HttpClient _http = new();
    private const string BaseUrl = "https://api.msg91.com/api/v5/";

    public string ProviderKey => "msg91";

    public async Task SendAsync(string toPhone, string message, CancellationToken ct = default)
    {
        var authKey    = config["Sms:Msg91:AuthKey"]    ?? throw new InvalidOperationException("Sms:Msg91:AuthKey not configured");
        var senderId   = config["Sms:Msg91:SenderId"]   ?? "CPOOL";
        var templateId = config["Sms:Msg91:TemplateId"] ?? throw new InvalidOperationException("Sms:Msg91:TemplateId not configured");

        var mobile = toPhone.Replace("+91", "").Replace(" ", "");

        var payload = new
        {
            template_id = templateId,
            sender      = senderId,
            short_url   = "0",
            mobiles     = $"91{mobile}",
            VAR1        = message
        };

        var request = new HttpRequestMessage(HttpMethod.Post, $"{BaseUrl}flow/")
        {
            Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
        };
        request.Headers.TryAddWithoutValidation("authkey", authKey);
        request.Headers.TryAddWithoutValidation("accept", "application/json");

        var response = await _http.SendAsync(request, ct);
        var body     = await response.Content.ReadAsStringAsync(ct);

        if (!response.IsSuccessStatusCode)
            logger.LogError("[SMS:msg91] Failed — Status={Status} Body={Body}", response.StatusCode, body);
        else
            logger.LogInformation("[SMS:msg91] Sent to {Phone}", toPhone);
    }
}
