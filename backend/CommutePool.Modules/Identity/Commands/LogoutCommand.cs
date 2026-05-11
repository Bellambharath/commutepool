using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Identity.Commands;

public sealed record LogoutCommand(string RefreshToken) : IRequest<Result>;
