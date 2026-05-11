using CommutePool.Modules.Identity.Dtos;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Identity.Commands;

public sealed record RefreshTokenCommand(string RefreshToken) : IRequest<Result<TokenResponseDto>>;
