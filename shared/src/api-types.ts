// ─────────────────────────────────────────────────────────────────
// CommutePool — Shared API Types
// Request/response shapes consumed by Android, Web, and Admin.
// ─────────────────────────────────────────────────────────────────

import type {
  UserRoleMode,
  AccountStatus,
  VerificationDocumentType,
  VerificationStatus,
  OwnerEligibilityStatus,
  PickupMode,
  RideOfferStatus,
  RideRequestStatus,
  MatchStatus,
  TripStatus,
  IncidentType,
  IncidentSeverity,
  IncidentStatus,
  SupportTicketStatus,
  SupportTicketPriority,
  NotificationType,
} from './enums';

// ─── API Envelope ───
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ─── Auth ───
export interface RequestOtpRequest { phone: string; }
export interface VerifyOtpRequest { phone: string; otp: string; }
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserSummary;
  navigationBootstrap: NavigationBootstrap;
}

export interface NavigationBootstrap {
  profileComplete: boolean;
  companyVerified: boolean;
  ownerEligible: boolean;
  activeTrip: string | null;  // tripId if exists
  pendingMatches: number;
  nextScreen: string;
}

// ─── User ───
export interface UserSummary {
  id: string;
  name: string;
  phone: string;
  roleMode: UserRoleMode;
  accountStatus: AccountStatus;
  avatarUrl?: string;
}

export interface UserProfile extends UserSummary {
  email?: string;
  emergencyContact?: EmergencyContact;
  trustScore?: number;
  createdAt: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation?: string;
}

// ─── Verification ───
export interface VerificationStatusResponse {
  ownerEligibility: OwnerEligibilityStatus;
  documents: VerificationDocument[];
}

export interface VerificationDocument {
  id: string;
  documentType: VerificationDocumentType;
  status: VerificationStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}

// ─── Commute ───
export interface CommuteProfile {
  id: string;
  label?: string;
  corridorId: string;
  homeZoneLabel: string;
  officeZoneLabel: string;
  workingDays: number[];
  morningWindowStart: string;  // HH:mm
  morningWindowEnd: string;
  eveningWindowStart: string;
  eveningWindowEnd: string;
  active: boolean;
  pickupMode: PickupMode;
}

// ─── Offer ───
export interface RideOffer {
  id: string;
  ownerId: string;
  vehicleId: string;
  commuteProfileId: string;
  corridorId: string;
  pickupMode: PickupMode;
  availableSeats: number;
  status: RideOfferStatus;
  createdAt: string;
}

// ─── Request ───
export interface RideRequest {
  id: string;
  riderId: string;
  commuteProfileId: string;
  corridorId: string;
  pickupModePref: PickupMode;
  status: RideRequestStatus;
  createdAt: string;
}

// ─── Match ───
export interface MatchSummary {
  id: string;
  offerId: string;
  requestId: string;
  corridorId: string;
  score: number;
  status: MatchStatus;
  expiresAt?: string;
  pickupOptions: PickupOption[];
  ownerSummary: UserSummary;
  riderSummary: UserSummary;
}

export interface PickupOption {
  id: string;
  optionType: string;
  label?: string;
  geo?: { lat: number; lng: number };
  detourMinutes: number;
  priceDelta: number;
  selected: boolean;
}

// ─── Trip ───
export interface TripSummary {
  id: string;
  matchId: string;
  ownerId: string;
  riderId: string;
  corridorId: string;
  status: TripStatus;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  ownerSummary: UserSummary;
  riderSummary: UserSummary;
}

// ─── Incident ───
export interface Incident {
  id: string;
  tripId?: string;
  reporterId: string;
  incidentType: IncidentType;
  severity: IncidentSeverity;
  status: IncidentStatus;
  description?: string;
  assigneeId?: string;
  resolutionNote?: string;
  createdAt: string;
}

// ─── Support ───
export interface SupportTicket {
  id: string;
  userId: string;
  tripId?: string;
  incidentId?: string;
  subject: string;
  category?: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  createdAt: string;
}

// ─── Notification ───
export interface Notification {
  id: string;
  notificationType: NotificationType;
  title?: string;
  body?: string;
  deepLink?: string;
  read: boolean;
  createdAt: string;
}
