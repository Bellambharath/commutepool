using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Company.Commands;

public sealed record InitiateOfficeEmailVerificationCommand(
    Guid UserId,
    string WorkEmail) : IRequest<Result>;

public sealed record ConfirmOfficeEmailVerificationCommand(
    Guid UserId,
    string Token) : IRequest<Result>;

public sealed record EnsureCompanyExistsCommand(
    string EmailDomain,
    string CompanyName) : IRequest<Result<Guid>>;
