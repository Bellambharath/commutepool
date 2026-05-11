using CommutePool.Modules.Vehicle.Commands;
using CommutePool.Modules.Vehicle.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace CommutePool.Api.Controllers;

[ApiController]
[Route("api/vehicles")]
[Authorize]
public sealed class VehicleController(IMediator mediator) : ControllerBase
{
    private Guid UserId =>
        Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)!.Value);

    [HttpGet]
    public async Task<IActionResult> GetMyVehicles()
    {
        var result = await mediator.Send(new GetMyVehiclesQuery(UserId));
        return result.IsSuccess ? Ok(result.Value) : BadRequest(result.Error);
    }

    [HttpPost]
    public async Task<IActionResult> Register([FromBody] RegisterVehicleRequest body)
    {
        var result = await mediator.Send(new RegisterVehicleCommand(UserId, body.RegistrationNo, body.Make, body.Model));
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetMyVehicles), new { }, new { vehicleId = result.Value })
            : BadRequest(result.Error);
    }

    [HttpPost("{vehicleId}/activate")]
    public async Task<IActionResult> Activate(Guid vehicleId)
    {
        var result = await mediator.Send(new ActivateVehicleCommand(UserId, vehicleId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    [HttpPost("{vehicleId}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid vehicleId)
    {
        var result = await mediator.Send(new DeactivateVehicleCommand(UserId, vehicleId));
        return result.IsSuccess ? NoContent() : BadRequest(result.Error);
    }

    public sealed record RegisterVehicleRequest(
        string RegistrationNo,
        string? Make,
        string? Model);
}
