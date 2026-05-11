using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Verification.Queries;

public sealed record GetVerificationStatusQuery(Guid UserId) : IRequest<Result<VerificationStatusDto>>;
public sealed record GetPendingVerificationsQuery(int Page, int PageSize) : IRequest<Result<List<VerificationCaseDto>>>;
public sealed record GetVerificationCaseDetailQuery(Guid CaseId) : IRequest<Result<VerificationCaseDto>>;

public sealed record VerificationStatusDto(
    string OwnerEligibility,
    List<VerificationDocumentDto> Documents);

public sealed record VerificationDocumentDto(
    Guid Id,
    string DocumentType,
    string Status,
    string? RejectionReason,
    DateTimeOffset? ReviewedAt);

public sealed record VerificationCaseDto(
    Guid Id,
    Guid UserId,
    string UserPhone,
    string? UserName,
    string DocumentType,
    string Status,
    string? ArtifactUrl,
    string? RejectionReason,
    DateTimeOffset CreatedAt,
    DateTimeOffset? ReviewedAt);
