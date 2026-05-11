// ---- Auth ----
export interface OtpRequestDto { phone: string; }
export interface OtpVerifyDto { phone: string; otp: string; }
export interface AuthTokenDto { accessToken: string; refreshToken: string; expiresIn: number; }

// ---- User ----
export interface UserProfileDto {
  id: string;
  phone: string;
  name?: string;
  email?: string;
  gender?: string;
  trustScore: number;
  ownerEligibility: OwnerEligibilityStatus;
  createdAt: string;
}
export type OwnerEligibilityStatus = 'NOT_ELIGIBLE' | 'PENDING' | 'ELIGIBLE';

// ---- Verification ----
export interface VerificationStatusDto {
  ownerEligibility: OwnerEligibilityStatus;
  documents: VerificationDocumentDto[];
}
export interface VerificationDocumentDto {
  id: string;
  documentType: DocumentType;
  status: VerificationStatus;
  rejectionReason?: string;
  reviewedAt?: string;
}
export type DocumentType = 'DriverLicense' | 'VehicleRc' | 'Selfie';
export type VerificationStatus = 'Pending' | 'Approved' | 'Rejected';

// ---- Corridor ----
export interface CorridorDto {
  id: string;
  name: string;
  slug: string;
  city: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  active: boolean;
}

// ---- Commute ----
export interface CommuteProfileDto {
  id: string;
  corridorId: string;
  corridorName: string;
  homeArea: string;
  homeLat: number;
  homeLng: number;
  officeArea: string;
  officeLat: number;
  officeLng: number;
  morningDepartureTime: string;
  eveningDepartureTime: string;
  activeDays: string[];
  paused: boolean;
}

// ---- Offer ----
export interface OfferDto {
  id: string;
  ownerId: string;
  ownerName: string;
  vehicleId: string;
  vehicleRegistrationNo: string;
  direction: TripDirection;
  offerDate: string;
  departureTime: string;
  availableSeats: number;
  acceptedSeats: number;
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  status: OfferStatus;
  createdAt: string;
}
export type TripDirection = 'ToOffice' | 'ToHome';
export type OfferStatus = 'Open' | 'Partial' | 'Full' | 'Cancelled' | 'Completed';

// ---- Request ----
export interface RideRequestDto {
  id: string;
  offerId: string;
  riderId: string;
  riderName: string;
  status: RequestStatus;
  note?: string;
  declineReason?: string;
  createdAt: string;
}
export type RequestStatus = 'Pending' | 'Accepted' | 'Declined' | 'Withdrawn';

// ---- Match ----
export interface MatchDto {
  id: string;
  offerId: string;
  rideRequestId: string;
  ownerId: string;
  ownerName: string;
  riderId: string;
  riderName: string;
  score: number;
  status: MatchStatus;
  pickupOptionId?: string;
  createdAt: string;
}
export type MatchStatus = 'Confirmed' | 'TripStarted' | 'TripCompleted' | 'Cancelled' | 'Expired';

// ---- Trip ----
export interface TripDto {
  id: string;
  matchId: string;
  ownerId: string;
  ownerName: string;
  riderId: string;
  riderName: string;
  status: TripStatus;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
}
export type TripStatus = 'InProgress' | 'Completed' | 'Cancelled' | 'NoShow';

// ---- Rating ----
export interface RatingDto {
  id: string;
  tripId: string;
  raterUserId: string;
  raterName: string;
  stars: number;
  comment?: string;
  createdAt: string;
}
export interface TrustScoreDto {
  userId: string;
  score: number;
  totalRatings: number;
  lastComputedAt: string;
}

// ---- Notification ----
export interface NotificationDto {
  id: string;
  title: string;
  body: string;
  category: string;
  deepLink?: string;
  read: boolean;
  createdAt: string;
}

// ---- Support ----
export interface TicketDto {
  id: string;
  category: string;
  subject: string;
  status: TicketStatus;
  assignedAdminId?: string;
  createdAt: string;
  updatedAt: string;
}
export type TicketStatus = 'Open' | 'InProgress' | 'Resolved' | 'Closed';

// ---- Safety ----
export interface IncidentDto {
  id: string;
  reportedByUserId: string;
  reporterName: string;
  tripId?: string;
  incidentType: string;
  status: string;
  description: string;
  isSos: boolean;
  lat?: number;
  lng?: number;
  createdAt: string;
  resolvedAt?: string;
}

// ---- Analytics ----
export interface TripMetricsDto {
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  noShowTrips: number;
  completionRate: number;
}
export interface FunnelMetricsDto {
  totalUsers: number;
  verifiedUsers: number;
  usersWithCommuteProfile: number;
  usersWhoMadeOffer: number;
  usersWhoMadeRequest: number;
  usersWhoCompletedTrip: number;
}
