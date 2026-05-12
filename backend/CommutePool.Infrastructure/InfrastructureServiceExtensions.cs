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
        // Render injects DATABASE_URL as a plain env var (postgresql://...) 
        // Fall back to ConnectionStrings:DefaultConnection for local dev
        var connectionString =
            Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? configuration.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException(
                "No database connection string found. " +
                "Set DATABASE_URL env var or ConnectionStrings:DefaultConnection in appsettings.");

        services.AddDbContext<CommutePoolDbContext>(options =>
            options.UseNpgsql(
                connectionString,
                npgsql => npgsql.MigrationsAssembly(typeof(CommutePoolDbContext).Assembly.FullName)));

        return services;
    }
}
