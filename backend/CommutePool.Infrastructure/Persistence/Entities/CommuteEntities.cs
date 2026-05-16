using CommutePool.Shared.Enums;
using System.ComponentModel.DataAnnotations.Schema;

namespace CommutePool.Infrastructure.Persistence.Entities;

[Table("corridors")]
public sealed class CorridorEntity
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string OriginLabel { get; set; } = string.Empty;
    public string DestinationLabel { get; set; } = string.Empty;
    public string? OriginGeo { get; set; }
    public string? DestinationGeo { get; set; }
    public int MaxDetourMinutes { get; set; } = 10;
    public bool ExactPickupEnabled { get; set; } = false;
    public bool Active { get; set; } = false;
    public string? OperationalNotes { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("corridor_company_restrictions")]
public sealed class CorridorCompanyRestrictionEntity
{
    public Guid Id { get; set; }
    public Guid CorridorId { get; set; }
    public Guid CompanyId { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
}

[Table("recurring_pairs")]
public sealed class RecurringPairEntity
{
    public Guid Id { get; set; }
    public Guid MatchId { get; set; }
    public Guid OwnerId { get; set; }
    public Guid RiderId { get; set; }
    public Guid CorridorId { get; set; }
    public RecurringPairStatus Status { get; set; } = RecurringPairStatus.Active;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("vehicles")]
public sealed class VehicleEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string? Make { get; set; }
    public string? Model { get; set; }
    public string RegistrationNo { get; set; } = string.Empty;
    public string VehicleType { get; set; } = "BIKE";
    public bool Active { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public UserEntity User { get; set; } = null!;
}

[Table("commute_profiles")]
public sealed class CommuteProfileEntity
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid CorridorId { get; set; }

    // Home location
    public string HomeArea { get; set; } = string.Empty;
    public double HomeLat { get; set; }
    public double HomeLng { get; set; }

    // Office location
    public string OfficeArea { get; set; } = string.Empty;
    public double OfficeLat { get; set; }
    public double OfficeLng { get; set; }

    // Schedule
    public TimeOnly MorningDepartureTime { get; set; }
    public TimeOnly EveningDepartureTime { get; set; }
    public int[] ActiveDays { get; set; } = [];   // 0=Sun … 6=Sat

    public bool Paused { get; set; } = false;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public UserEntity User { get; set; } = null!;
    public CorridorEntity Corridor { get; set; } = null!;
}

[Table("ride_offers")]
public sealed class RideOfferEntity
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public Guid VehicleId { get; set; }
    public Guid CommuteProfileId { get; set; }
    public Guid CorridorId { get; set; }
    public PickupMode PickupMode { get; set; } = PickupMode.RoutePointOnly;
    public int AvailableSeats { get; set; } = 1;
    public RideOfferStatus Status { get; set; } = RideOfferStatus.Active;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}

[Table("ride_requests")]
public sealed class RideRequestEntity
{
    public Guid Id { get; set; }
    public Guid RiderId { get; set; }
    public Guid CommuteProfileId { get; set; }
    public Guid CorridorId { get; set; }
    public PickupMode PickupModePref { get; set; } = PickupMode.RoutePointOnly;
    public RideRequestStatus Status { get; set; } = RideRequestStatus.Active;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
}
