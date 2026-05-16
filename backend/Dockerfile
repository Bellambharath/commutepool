# ── Build stage ────────────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + all project files first (layer-cache friendly)
COPY CommutePool.sln ./
COPY CommutePool.Shared/CommutePool.Shared.csproj             CommutePool.Shared/
COPY CommutePool.Infrastructure/CommutePool.Infrastructure.csproj CommutePool.Infrastructure/
COPY CommutePool.Modules/CommutePool.Modules.csproj           CommutePool.Modules/
COPY CommutePool.Api/CommutePool.Api.csproj                   CommutePool.Api/

# Restore (uses layer cache unless .csproj files change)
RUN dotnet restore CommutePool.Api/CommutePool.Api.csproj

# Copy everything else and publish
COPY . .
RUN dotnet publish CommutePool.Api/CommutePool.Api.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ─────────────────────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

COPY --from=build /app/publish .

# Do NOT hardcode ASPNETCORE_URLS here.
# Render injects PORT=3000 at runtime; ASP.NET Core automatically reads it
# via the HTTP_PORTS env var (ASP.NET 8+) so no manual wiring is needed.
# If you must set a fallback, use the ENTRYPOINT with an env shim instead.

EXPOSE 3000

ENTRYPOINT ["dotnet", "CommutePool.Api.dll"]
