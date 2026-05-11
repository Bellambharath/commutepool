using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace CommutePool.Modules.Identity.Services;

public sealed class JwtService(IConfiguration configuration)
{
    private readonly string _secret = configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret required");
    private readonly int _accessExpiryMinutes =
        int.Parse(configuration["Jwt:AccessTokenExpiryMinutes"] ?? "60");
    private readonly int _refreshExpiryDays =
        int.Parse(configuration["Jwt:RefreshTokenExpiryDays"] ?? "30");

    public string GenerateAccessToken(Guid userId, string phone)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.MobilePhone, phone),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_accessExpiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public DateTimeOffset RefreshTokenExpiry =>
        DateTimeOffset.UtcNow.AddDays(_refreshExpiryDays);
}
