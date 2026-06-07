// ============================================================
// CommutePool — Shared TypeScript Types
// All enums and interfaces used across api, web, and mobile.
// ============================================================

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export enum UserRole {
  RIDER = "RIDER",
  OWNER = "OWNER",
  BOTH = "BOTH",
}

export enum UserStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
}

export enum VerificationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}

export enum TripStatus {
  SCHEDULED = "SCHEDULED",
  ARRIVING = "ARRIVING",
  STARTED = "STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum BookingStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
  EXPIRED = "EXPIRED",
  CANCELLED = "CANCELLED",
}

export enum CancellationReason {
  PENALTY_FREE = "PENALTY_FREE",
  LATE_CANCEL = "LATE_CANCEL",
  NO_SHOW = "NO_SHOW",
  FORCE_MAJEURE = "FORCE_MAJEURE",
}

export enum CommutePeriod {
  MORNING = "MORNING",
  EVENING = "EVENING",
}

// ---------------------------------------------------------------------------
// Core entity interfaces
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  phone: string; // format: +91XXXXXXXXXX
  name: string;
  photoUrl: string | null;
  role: UserRole;
  status: UserStatus;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  cancellationStrikes: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface BikeOwnerProfile {
  id: string;
  userId: string;
  bikeModel: string;
  mileageOverrideKmpl: number | null; // integer kmpl, set by owner; null = use admin table
  dlUrl: string; // Cloudinary URL
  rcUrl: string; // Cloudinary URL
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
  verifiedBy: string | null; // admin user id
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommuteRoute {
  id: string;
  userId: string;
  period: CommutePeriod;
  encodedPolyline: string; // Google Maps encoded polyline
  distanceMeters: number; // integer metres
  durationSeconds: number; // integer seconds
  routeLabel: string | null; // e.g. "Home to Office"
  isPrimary: boolean;
  sourcePlaceId: string;
  sourceLat: number;
  sourceLng: number;
  sourceAddress: string;
  destinationPlaceId: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // routeGeometry is a PostGIS LINESTRING — not exposed directly in app layer
}

export interface WeeklyOffer {
  id: string;
  ownerId: string;
  routeId: string;
  period: CommutePeriod;
  weekStartDate: string; // ISO date string YYYY-MM-DD (Monday of the week)
  daysAvailable: number[]; // 0 = Sunday … 6 = Saturday
  departureWindowStart: string; // HH:MM in IST
  departureWindowEnd: string; // HH:MM in IST
  seatsAvailable: number; // always 1 for bike pillion
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyRequest {
  id: string;
  riderId: string;
  period: CommutePeriod;
  weekStartDate: string; // ISO date string YYYY-MM-DD
  daysNeeded: number[]; // 0 = Sunday … 6 = Saturday
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  pickupPlaceId: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  dropoffPlaceId: string;
  departureWindowStart: string; // HH:MM in IST
  departureWindowEnd: string; // HH:MM in IST
  status: "OPEN" | "MATCHED" | "EXPIRED";
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchPickupOption {
  pickupPointLat: number;
  pickupPointLng: number;
  pickupWalkMeters: number; // integer metres rider walks to pickup point
  dropoffPointLat: number;
  dropoffPointLng: number;
  dropoffWalkMeters: number; // integer metres rider walks from dropoff point
}

export interface Match {
  id: string;
  offerId: string;
  requestId: string;
  compatibilityScore: number; // 0–100 computed by matching engine
  detourDistanceMeters: number; // integer metres owner detours for this rider
  detourCostPaise: number; // integer paise
  baseContributionPaise: number; // shared base cost before detour, integer paise
  totalContributionPaise: number; // final amount rider pays per trip, integer paise
  pickupPointLat: number;
  pickupPointLng: number;
  pickupWalkMeters: number;
  dropoffPointLat: number;
  dropoffPointLng: number;
  dropoffWalkMeters: number;
  isPartialRoute: boolean; // true if rider uses < 70% of owner route
  routeUsagePercentage: number; // 0–100
  createdAt: Date;
}

export interface Booking {
  id: string;
  matchId: string;
  riderId: string;
  ownerId: string;
  status: BookingStatus;
  daysConfirmed: number[]; // subset of WeeklyOffer.daysAvailable
  contributionPerDayPaise: number; // integer paise
  requestSentAt: Date;
  expiresAt: Date;
  respondedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingDay {
  bookingId: string;
  date: string; // ISO date YYYY-MM-DD
  dayOfWeek: number; // 0–6
  tripId: string | null; // populated once trip is created
}

export interface Trip {
  id: string;
  bookingId: string;
  riderId: string;
  ownerId: string;
  scheduledDate: string; // ISO date YYYY-MM-DD
  scheduledDeparture: string; // HH:MM in IST
  period: CommutePeriod;
  status: TripStatus;
  actualDeparture: Date | null;
  actualArrival: Date | null;
  pickupConfirmedAt: Date | null;
  sosTriggedAt: Date | null;
  sosResolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Contribution {
  id: string;
  tripId: string;
  riderId: string;
  ownerId: string;
  amountPaise: number; // integer paise — NEVER float
  paymentMethod: "CASH" | "UPI";
  markedPaidAt: Date | null; // owner marks as received
  confirmedByRiderAt: Date | null; // rider confirms payment sent
  createdAt: Date;
}

export interface Cancellation {
  id: string;
  bookingId: string | null;
  tripId: string | null;
  cancelledById: string;
  reasonCode: CancellationReason;
  hoursBeforeDeparture: number; // computed at time of cancellation
  penaltyApplied: number; // number of strikes added (0, 1, or 2)
  disputeRaised: boolean;
  disputeResolvedAt: Date | null;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  raisedById: string;
  tripId: string | null;
  bookingId: string | null;
  subject: string;
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolvedAt: Date | null;
  resolvedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string; // e.g. "APPROVE_BIKE_OWNER", "SET_FUEL_PRICE"
  entityType: string; // e.g. "bike_owner_profiles", "admin_fuel_prices"
  entityId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: Date;
  // NO updatedAt — audit logs are fully immutable
  // NO deletedAt — audit logs are never soft-deleted
}

export interface AdminFuelPrice {
  id: string;
  city: string; // "Hyderabad" for pilot
  pricePaisePerLitre: number; // integer paise e.g. 10500 = ₹105/litre
  effectiveFrom: Date;
  createdById: string; // admin user id
  createdAt: Date;
}

export interface AdminBikeMileage {
  id: string;
  bikeModel: string; // unique — e.g. "Activa 6G"
  realWorldKmpl: number; // integer kmpl
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}
