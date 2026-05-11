using Microsoft.Extensions.DependencyInjection;

namespace CommutePool.Modules.UserProfile;

public static class UserProfileModuleExtensions
{
    public static IServiceCollection AddUserProfileModule(this IServiceCollection services)
        => services; // Handlers auto-registered via MediatR assembly scan
}
