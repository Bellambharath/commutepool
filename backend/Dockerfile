# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy everything then restore+publish in one step
# (avoids NETSDK1004 project.assets.json mismatch from split restore/publish)
COPY . .

RUN dotnet publish CommutePool.Api/CommutePool.Api.csproj \
    -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

COPY --from=build /app/publish .
EXPOSE 10000

ENTRYPOINT ["dotnet", "CommutePool.Api.dll"]
