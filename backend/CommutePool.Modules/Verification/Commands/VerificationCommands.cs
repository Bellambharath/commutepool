using CommutePool.Shared.Enums;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Verification.Commands;

public sealed record SubmitVerificationDocumentCommand(
    Guid UserId,
    VerificationDocumentType DocumentType,
    string ArtifactUrl) : IRequest<Result<Guid>>;

public sealed record ApproveVerificationCommand(
    Guid ReviewerId,
    Guid CaseId) : IRequest<Result>;

public sealed record RejectVerificationCommand(
    Guid ReviewerId,
    Guid CaseId,
    string Reason) : IRequest<Result>;

public sealed record RecomputeOwnerEligibilityCommand(
    Guid UserId) : IRequest<Result<string>>;
