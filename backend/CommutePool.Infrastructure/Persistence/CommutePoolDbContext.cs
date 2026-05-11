using CommutePool.Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace CommutePool.Infrastructure.Persistence;

public sealed class CommutePoolDbContext(DbContextOptions<CommutePoolDbContext> options)
    : DbContext(options)
{
    // Identity
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<OtpRequestEntity> OtpRequests => Set<OtpRequestEntity>();
    public DbSet<SessionEntity> Sessions => Set<SessionEntity>();

    // Profile
    public DbSet<EmergencyContactEntity> EmergencyContacts => Set<EmergencyContactEntity>();

    // Company
    public DbSet<CompanyEntity> Companies => Set<CompanyEntity>();
    public DbSet<UserCompanyMembershipEntity> UserCompanyMemberships => Set<UserCompanyMembershipEntity>();

    // Verification
    public DbSet<VerificationCaseEntity> VerificationCases => Set<VerificationCaseEntity>();
    public DbSet<OwnerEligibilityEntity> OwnerEligibilities => Set<OwnerEligibilityEntity>();

    // Vehicle + Corridor
    public DbSet<VehicleEntity> Vehicles => Set<VehicleEntity>();
    public DbSet<CorridorEntity> Corridors => Set<CorridorEntity>();
    public DbSet<CorridorCompanyRestrictionEntity> CorridorCompanyRestrictions => Set<CorridorCompanyRestrictionEntity>();

    // Commute
    public DbSet<CommuteProfileEntity> CommuteProfiles => Set<CommuteProfileEntity>();
    public DbSet<RideOfferEntity> RideOffers => Set<RideOfferEntity>();
    public DbSet<RideRequestEntity> RideRequests => Set<RideRequestEntity>();

    // Matching + Trip
    public DbSet<MatchCandidateEntity> MatchCandidates => Set<MatchCandidateEntity>();
    public DbSet<RecurringPairEntity> RecurringPairs => Set<RecurringPairEntity>();
    public DbSet<PickupOptionEntity> PickupOptions => Set<PickupOptionEntity>();
    public DbSet<TripEntity> Trips => Set<TripEntity>();
    public DbSet<TripCheckpointEntity> TripCheckpoints => Set<TripCheckpointEntity>();

    // Trust + Safety
    public DbSet<RatingEntity> Ratings => Set<RatingEntity>();
    public DbSet<TrustScoreEntity> TrustScores => Set<TrustScoreEntity>();
    public DbSet<IncidentEntity> Incidents => Set<IncidentEntity>();

    // Support
    public DbSet<SupportTicketEntity> SupportTickets => Set<SupportTicketEntity>();
    public DbSet<SupportTicketMessageEntity> SupportTicketMessages => Set<SupportTicketMessageEntity>();

    // Notifications + Outbox + Audit
    public DbSet<NotificationEntity> Notifications => Set<NotificationEntity>();
    public DbSet<PushTokenEntity> PushTokens => Set<PushTokenEntity>();
    public DbSet<OutboxEventEntity> OutboxEvents => Set<OutboxEventEntity>();
    public DbSet<AuditLogEntity> AuditLogs => Set<AuditLogEntity>();
    public DbSet<PricingPolicyEntity> PricingPolicies => Set<PricingPolicyEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CommutePoolDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
