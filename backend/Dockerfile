# ── Build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution + project files first (layer-cache friendly)
COPY CommutePool.sln ./
COPY CommutePool.Api/CommutePool.Api.csproj             CommutePool.Api/
COPY CommutePool.Infrastructure/CommutePool.Infrastructure.csproj CommutePool.Infrastructure/
COPY CommutePool.Modules/CommutePool.Modules.csproj     CommutePool.Modules/
COPY CommutePool.Shared/CommutePool.Shared.csproj       CommutePool.Shared/

RUN dotnet restore CommutePool.sln

# Copy everything and publish
COPY . .
RUN dotnet publish CommutePool.Api/CommutePool.Api.csproj \
    -c Release -o /app/publish --no-restore

# ── Runtime stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

# Render free tier listens on port 10000
ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
EXPOSE 10000

ENTRYPOINT ["dotnet", "CommutePool.Api.dll"]
