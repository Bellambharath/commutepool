using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Company.Commands;
using CommutePool.Modules.Company.Queries;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Company.Handlers;

public sealed class EnsureCompanyExistsHandler(
    CommutePoolDbContext db) : IRequestHandler<EnsureCompanyExistsCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(EnsureCompanyExistsCommand request, CancellationToken ct)
    {
        var company = await db.Companies
            .FirstOrDefaultAsync(c => c.EmailDomain == request.EmailDomain, ct);

        if (company is not null)
            return Result<Guid>.Ok(company.Id);

        company = new CompanyEntity
        {
            Id = Guid.NewGuid(),
            Name = request.CompanyName,
            EmailDomain = request.EmailDomain,
            Active = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        db.Companies.Add(company);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(company.Id);
    }
}

public sealed class InitiateOfficeEmailVerificationHandler(
    CommutePoolDbContext db) : IRequestHandler<InitiateOfficeEmailVerificationCommand, Result>
{
    public async Task<Result> Handle(InitiateOfficeEmailVerificationCommand request, CancellationToken ct)
    {
        var domain = request.WorkEmail.Split('@').LastOrDefault() ?? string.Empty;
        var company = await db.Companies.FirstOrDefaultAsync(c => c.EmailDomain == domain, ct);
        if (company is null)
            return Result.Fail("COMPANY_NOT_FOUND", "No registered company found for this email domain.");

        var existing = await db.UserCompanyMemberships
            .FirstOrDefaultAsync(m => m.UserId == request.UserId && m.CompanyId == company.Id, ct);

        if (existing is null)
        {
            db.UserCompanyMemberships.Add(new UserCompanyMembershipEntity
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                CompanyId = company.Id,
                WorkEmail = request.WorkEmail,
                Verified = false,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
            await db.SaveChangesAsync(ct);
        }

        // TODO: Send verification email with token
        return Result.Ok();
    }
}

public sealed class ConfirmOfficeEmailVerificationHandler(
    CommutePoolDbContext db) : IRequestHandler<ConfirmOfficeEmailVerificationCommand, Result>
{
    public async Task<Result> Handle(ConfirmOfficeEmailVerificationCommand request, CancellationToken ct)
    {
        // TODO: Validate token from email link, then mark verified
        // For now: direct confirm by userId (admin flow / dev shortcut)
        var membership = await db.UserCompanyMemberships
            .FirstOrDefaultAsync(m => m.UserId == request.UserId, ct);

        if (membership is null)
            return Result.Fail("MEMBERSHIP_NOT_FOUND", "No pending company membership found.");

        membership.Verified = true;
        membership.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class GetCompanyByDomainHandler(
    CommutePoolDbContext db) : IRequestHandler<GetCompanyByDomainQuery, Result<CompanyDto>>
{
    public async Task<Result<CompanyDto>> Handle(GetCompanyByDomainQuery request, CancellationToken ct)
    {
        var company = await db.Companies
            .FirstOrDefaultAsync(c => c.EmailDomain == request.EmailDomain, ct);

        return company is null
            ? Result<CompanyDto>.Fail("NOT_FOUND", "Company not found.")
            : Result<CompanyDto>.Ok(new CompanyDto(company.Id, company.Name, company.EmailDomain, company.EnterpriseMode, company.Active));
    }
}

public sealed class GetUserCompanyMembershipHandler(
    CommutePoolDbContext db) : IRequestHandler<GetUserCompanyMembershipQuery, Result<CompanyMembershipDto?>>
{
    public async Task<Result<CompanyMembershipDto?>> Handle(GetUserCompanyMembershipQuery request, CancellationToken ct)
    {
        var membership = await db.UserCompanyMemberships
            .Include(m => m.Company)
            .FirstOrDefaultAsync(m => m.UserId == request.UserId, ct);

        if (membership is null)
            return Result<CompanyMembershipDto?>.Ok(null);

        return Result<CompanyMembershipDto?>.Ok(new CompanyMembershipDto(
            membership.CompanyId,
            membership.Company.Name,
            membership.WorkEmail,
            membership.Verified));
    }
}
