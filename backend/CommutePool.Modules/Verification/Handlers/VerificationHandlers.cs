using CommutePool.Infrastructure.Persistence;
using CommutePool.Infrastructure.Persistence.Entities;
using CommutePool.Modules.Verification.Commands;
using CommutePool.Modules.Verification.Queries;
using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Modules.Verification.Handlers;

public sealed class SubmitVerificationDocumentHandler(
    CommutePoolDbContext db) : IRequestHandler<SubmitVerificationDocumentCommand, Result<Guid>>
{
    public async Task<Result<Guid>> Handle(SubmitVerificationDocumentCommand request, CancellationToken ct)
    {
        // Reject duplicate pending submissions
        var hasPending = await db.VerificationCases.AnyAsync(
            v => v.UserId == request.UserId
              && v.DocumentType == request.DocumentType
              && v.Status == VerificationStatus.Pending, ct);

        if (hasPending)
            return Result<Guid>.Fail("ALREADY_PENDING", "A pending submission already exists for this document type.");

        var caseEntity = new VerificationCaseEntity
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            DocumentType = request.DocumentType,
            Status = VerificationStatus.Pending,
            ArtifactUrl = request.ArtifactUrl,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        db.VerificationCases.Add(caseEntity);
        await db.SaveChangesAsync(ct);
        return Result<Guid>.Ok(caseEntity.Id);
    }
}

public sealed class ApproveVerificationHandler(
    CommutePoolDbContext db,
    IMediator mediator) : IRequestHandler<ApproveVerificationCommand, Result>
{
    public async Task<Result> Handle(ApproveVerificationCommand request, CancellationToken ct)
    {
        var cas = await db.VerificationCases.FindAsync([request.CaseId], ct);
        if (cas is null) return Result.Fail("NOT_FOUND", "Case not found.");
        if (cas.Status != VerificationStatus.Pending)
            return Result.Fail("INVALID_STATE", "Case is not in PENDING state.");

        cas.Status = VerificationStatus.Approved;
        cas.ReviewerId = request.ReviewerId;
        cas.ReviewedAt = DateTimeOffset.UtcNow;
        cas.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);

        await mediator.Send(new RecomputeOwnerEligibilityCommand(cas.UserId), ct);
        return Result.Ok();
    }
}

public sealed class RejectVerificationHandler(
    CommutePoolDbContext db) : IRequestHandler<RejectVerificationCommand, Result>
{
    public async Task<Result> Handle(RejectVerificationCommand request, CancellationToken ct)
    {
        var cas = await db.VerificationCases.FindAsync([request.CaseId], ct);
        if (cas is null) return Result.Fail("NOT_FOUND", "Case not found.");
        if (cas.Status != VerificationStatus.Pending)
            return Result.Fail("INVALID_STATE", "Case is not in PENDING state.");

        cas.Status = VerificationStatus.Rejected;
        cas.ReviewerId = request.ReviewerId;
        cas.RejectionReason = request.Reason;
        cas.ReviewedAt = DateTimeOffset.UtcNow;
        cas.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(ct);
        return Result.Ok();
    }
}

public sealed class RecomputeOwnerEligibilityHandler(
    CommutePoolDbContext db) : IRequestHandler<RecomputeOwnerEligibilityCommand, Result<string>>
{
    public async Task<Result<string>> Handle(RecomputeOwnerEligibilityCommand request, CancellationToken ct)
    {
        var approvedTypes = await db.VerificationCases
            .Where(v => v.UserId == request.UserId && v.Status == VerificationStatus.Approved)
            .Select(v => v.DocumentType)
            .ToListAsync(ct);

        var companyVerified = await db.UserCompanyMemberships
            .AnyAsync(m => m.UserId == request.UserId && m.Verified, ct);

        // Owner eligibility requires: DL + RC + Selfie approved + company email verified
        var isEligible =
            approvedTypes.Contains(VerificationDocumentType.DriverLicense) &&
            approvedTypes.Contains(VerificationDocumentType.VehicleRc) &&
            approvedTypes.Contains(VerificationDocumentType.Selfie) &&
            companyVerified;

        var hasPending =
            approvedTypes.Count < 3 &&
            await db.VerificationCases.AnyAsync(
                v => v.UserId == request.UserId && v.Status == VerificationStatus.Pending, ct);

        var newStatus = isEligible
            ? OwnerEligibilityStatus.Eligible
            : hasPending
                ? OwnerEligibilityStatus.Pending
                : OwnerEligibilityStatus.NotEligible;

        var eligibility = await db.OwnerEligibilities
            .FirstOrDefaultAsync(e => e.UserId == request.UserId, ct);

        if (eligibility is null)
        {
            db.OwnerEligibilities.Add(new OwnerEligibilityEntity
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                Status = newStatus,
                LastEvaluatedAt = DateTimeOffset.UtcNow,
                CreatedAt = DateTimeOffset.UtcNow,
                UpdatedAt = DateTimeOffset.UtcNow
            });
        }
        else
        {
            eligibility.Status = newStatus;
            eligibility.LastEvaluatedAt = DateTimeOffset.UtcNow;
            eligibility.UpdatedAt = DateTimeOffset.UtcNow;
        }

        await db.SaveChangesAsync(ct);
        return Result<string>.Ok(newStatus.ToString());
    }
}

public sealed class GetVerificationStatusHandler(
    CommutePoolDbContext db) : IRequestHandler<GetVerificationStatusQuery, Result<VerificationStatusDto>>
{
    public async Task<Result<VerificationStatusDto>> Handle(GetVerificationStatusQuery request, CancellationToken ct)
    {
        var cases = await db.VerificationCases
            .Where(v => v.UserId == request.UserId)
            .OrderByDescending(v => v.CreatedAt)
            .ToListAsync(ct);

        var eligibility = await db.OwnerEligibilities
            .FirstOrDefaultAsync(e => e.UserId == request.UserId, ct);

        return Result<VerificationStatusDto>.Ok(new VerificationStatusDto(
            OwnerEligibility: eligibility?.Status.ToString() ?? "NOT_ELIGIBLE",
            Documents: cases.Select(c => new VerificationDocumentDto(
                c.Id, c.DocumentType.ToString(), c.Status.ToString(),
                c.RejectionReason, c.ReviewedAt)).ToList()));
    }
}

public sealed class GetPendingVerificationsHandler(
    CommutePoolDbContext db) : IRequestHandler<GetPendingVerificationsQuery, Result<List<VerificationCaseDto>>>
{
    public async Task<Result<List<VerificationCaseDto>>> Handle(GetPendingVerificationsQuery request, CancellationToken ct)
    {
        var cases = await db.VerificationCases
            .Include(v => v.User)
            .Where(v => v.Status == VerificationStatus.Pending)
            .OrderBy(v => v.CreatedAt)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(v => new VerificationCaseDto(
                v.Id, v.UserId, v.User.Phone, v.User.Name,
                v.DocumentType.ToString(), v.Status.ToString(),
                v.ArtifactUrl, v.RejectionReason, v.CreatedAt, v.ReviewedAt))
            .ToListAsync(ct);

        return Result<List<VerificationCaseDto>>.Ok(cases);
    }
}

public sealed class GetVerificationCaseDetailHandler(
    CommutePoolDbContext db) : IRequestHandler<GetVerificationCaseDetailQuery, Result<VerificationCaseDto>>
{
    public async Task<Result<VerificationCaseDto>> Handle(GetVerificationCaseDetailQuery request, CancellationToken ct)
    {
        var v = await db.VerificationCases
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.Id == request.CaseId, ct);

        if (v is null) return Result<VerificationCaseDto>.Fail("NOT_FOUND", "Case not found.");

        return Result<VerificationCaseDto>.Ok(new VerificationCaseDto(
            v.Id, v.UserId, v.User.Phone, v.User.Name,
            v.DocumentType.ToString(), v.Status.ToString(),
            v.ArtifactUrl, v.RejectionReason, v.CreatedAt, v.ReviewedAt));
    }
}
