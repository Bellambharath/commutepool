using CommutePool.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Infrastructure;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Render injects DATABASE_URL as a postgresql:// URI.
        // Npgsql requires a key=value connection string, so we convert it here.
        // Falls back to ConnectionStrings:DefaultConnection for local dev (already key=value format).
        var rawUrl = Environment.GetEnvironmentVariable("DATABASE_URL");

        var connectionString = rawUrl is not null
            ? ConvertPostgresUrlToConnectionString(rawUrl)
            : configuration.GetConnectionString("DefaultConnection")
              ?? throw new InvalidOperationException(
                  "No database connection string found. " +
                  "Set DATABASE_URL env var or ConnectionStrings:DefaultConnection in appsettings.");

        services.AddDbContext<CommutePoolDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(typeof(CommutePoolDbContext).Assembly.FullName)));

        return services;
    }

    /// <summary>
    /// Converts a postgresql://user:password@host:port/database URI
    /// into an Npgsql key=value connection string.
    /// </summary>
    private static string ConvertPostgresUrlToConnectionString(string databaseUrl)
    {
        var uri = new Uri(databaseUrl);
        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : string.Empty;
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 5432;
        var database = uri.AbsolutePath.TrimStart('/');

        return $"Host={host};Port={port};Database={database};Username={user};Password={password};SSL Mode=Require;Trust Server Certificate=true";
    }
}
