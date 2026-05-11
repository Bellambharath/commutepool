using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Identity.Commands;

public sealed record RequestOtpCommand(string Phone) : IRequest<Result>;
