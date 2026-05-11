using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Company.Queries;

public sealed record GetCompanyByDomainQuery(string EmailDomain) : IRequest<Result<CompanyDto>>;
public sealed record GetUserCompanyMembershipQuery(Guid UserId) : IRequest<Result<CompanyMembershipDto?>>;

public sealed record CompanyDto(
    Guid Id,
    string Name,
    string EmailDomain,
    bool EnterpriseMode,
    bool Active);

public sealed record CompanyMembershipDto(
    Guid CompanyId,
    string CompanyName,
    string WorkEmail,
    bool Verified);
