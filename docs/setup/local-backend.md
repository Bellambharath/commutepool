# Local Backend Setup

## Prerequisites

- .NET 9 SDK
- PostgreSQL 15+ (or Supabase project)
- Visual Studio 2022 / Rider / VS Code with C# extension

## Steps

1. Clone the repo
2. Copy `.env.example` to `.env` and fill in values
3. Update `backend/CommutePool.Api/appsettings.Development.json` with your DB connection string
4. Run migrations:
   ```bash
   cd backend
   dotnet ef database update --project CommutePool.Infrastructure --startup-project CommutePool.Api
   ```
5. Start the API:
   ```bash
   cd backend/CommutePool.Api
   dotnet run
   ```
6. Open Swagger UI: http://localhost:8080/swagger

## Useful commands

```bash
# Add a new EF Core migration
dotnet ef migrations add <MigrationName> --project CommutePool.Infrastructure --startup-project CommutePool.Api

# Apply migrations
dotnet ef database update --project CommutePool.Infrastructure --startup-project CommutePool.Api

# Run all tests
dotnet test
```

## Module structure reminder

Each module under `CommutePool.Modules/` owns:
- `Commands/` — write side
- `Queries/` — read side
- `Handlers/` — MediatR handlers
- `Services/` — domain services
- `Dtos/` — data transfer objects
