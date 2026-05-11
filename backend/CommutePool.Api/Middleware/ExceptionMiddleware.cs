using CommutePool.Shared.Results;
using System.Net;
using System.Text.Json;

namespace CommutePool.Api.Middleware;

public sealed class ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json";
            var error = new ApiError("INTERNAL_ERROR", "An unexpected error occurred.");
            await context.Response.WriteAsync(JsonSerializer.Serialize(error));
        }
    }
}
