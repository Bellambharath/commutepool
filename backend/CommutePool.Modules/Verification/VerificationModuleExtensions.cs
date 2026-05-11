using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules.Verification;

public static class VerificationModuleExtensions
{
    public static IServiceCollection AddVerificationModule(this IServiceCollection services)
        => services; // All handlers auto-registered via MediatR assembly scan
}
