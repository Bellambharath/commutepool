// ─────────────────────────────────────────────────────────────────
// CommutePool — Shared Domain Enums (source of truth)
// All platforms must use these exact values. Do not redefine locally.
// ─────────────────────────────────────────────────────────────────

// Identity
export type UserRoleMode = 'RIDER' | 'OWNER' | 'BOTH';
export type AdminRole = 'OPS_ADMIN' | 'GRIEVANCE_ADMIN' | 'CORPORATE_ADMIN' | 'SUPER_ADMIN';
export type AccountStatus = 'ACTIVE' | 'SUSPENDED' | 'BLOCKED' | 'DELETED';

// Verification
export type VerificationDocumentType = 'OFFICE_EMAIL' | 'DRIVER_LICENSE' | 'VEHICLE_RC' | 'SELFIE';
export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type OwnerEligibilityStatus = 'NOT_ELIGIBLE' | 'PENDING' | 'ELIGIBLE';

// Commute
export type PickupMode = 'ROUTE_POINT_ONLY' | 'ROUTE_PLUS_NEAR_RIDER';
export type PickupOptionType = 'ROUTE_POINT' | 'NEAR_RIDER_POINT';
export type RideOfferStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';
export type RideRequestStatus = 'ACTIVE' | 'PAUSED' | 'CLOSED';

// Matching
export type MatchStatus =
  | 'PROPOSED'
  | 'PENDING_USER_ACTION'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'RECURRING_ACTIVE';
export type RecurringPairStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

// Trip
export type TripStatus =
  | 'SCHEDULED'
  | 'ARRIVING'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REPORTED';

// Safety
export type IncidentType =
  | 'UNSAFE_BEHAVIOR'
  | 'ROUTE_DEVIATION'
  | 'HARASSMENT'
  | 'ACCIDENT'
  | 'SOS'
  | 'OTHER';
export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'ESCALATED';

// Support
export type SupportTicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_USER' | 'RESOLVED' | 'CLOSED';
export type SupportTicketPriority = 'NORMAL' | 'HIGH' | 'URGENT';

// Notifications
export type NotificationType =
  | 'MATCH_AVAILABLE'
  | 'MATCH_ACCEPTED'
  | 'TRIP_REMINDER'
  | 'TRIP_STARTED'
  | 'TRIP_COMPLETED'
  | 'INCIDENT_UPDATE'
  | 'SUPPORT_UPDATE'
  | 'VERIFICATION_UPDATE';
