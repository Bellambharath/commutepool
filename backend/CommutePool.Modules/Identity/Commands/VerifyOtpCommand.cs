using CommutePool.Modules.Identity.Dtos;
using CommutePool.Shared.Results;
using MediatR;

namespace CommutePool.Modules.Identity.Commands;

public sealed record VerifyOtpCommand(string Phone, string Otp) : IRequest<Result<AuthResponseDto>>;
