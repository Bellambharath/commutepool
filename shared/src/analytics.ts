// ─────────────────────────────────────────────────────────────────
// CommutePool — Shared Analytics Event Names
// Use these constants everywhere. Do not hardcode event strings.
// ─────────────────────────────────────────────────────────────────

export const ANALYTICS_EVENTS = {
  // Auth
  OTP_REQUESTED: 'otp_requested',
  OTP_VERIFIED: 'otp_verified',
  SESSION_REVOKED: 'session_revoked',

  // Profile
  PROFILE_COMPLETED: 'profile_completed',
  EMERGENCY_CONTACT_ADDED: 'emergency_contact_added',

  // Verification
  OFFICE_VERIFICATION_STARTED: 'office_verification_started',
  DL_SUBMITTED: 'dl_submitted',
  RC_SUBMITTED: 'rc_submitted',
  VERIFICATION_APPROVED: 'verification_approved',

  // Commute
  COMMUTE_PROFILE_CREATED: 'commute_profile_created',
  COMMUTE_PROFILE_UPDATED: 'commute_profile_updated',

  // Offer / Request
  RIDE_OFFER_CREATED: 'ride_offer_created',
  RIDE_REQUEST_CREATED: 'ride_request_created',

  // Matching
  MATCH_VIEWED: 'match_viewed',
  MATCH_ACCEPTED: 'match_accepted',
  MATCH_REJECTED: 'match_rejected',
  PICKUP_OPTION_SELECTED: 'pickup_option_selected',
  RECURRING_PAIR_CREATED: 'recurring_pair_created',

  // Trip
  TRIP_SCHEDULED: 'trip_scheduled',
  TRIP_STARTED: 'trip_started',
  TRIP_COMPLETED: 'trip_completed',
  TRIP_CANCELLED: 'trip_cancelled',

  // Safety
  SOS_TRIGGERED: 'sos_triggered',
  INCIDENT_CREATED: 'incident_created',

  // Support
  SUPPORT_TICKET_CREATED: 'support_ticket_created',

  // Admin
  VERIFICATION_APPROVED_ADMIN: 'verification_approved_admin',
  VERIFICATION_REJECTED_ADMIN: 'verification_rejected_admin',
  INCIDENT_RESOLVED_ADMIN: 'incident_resolved_admin',
  USER_SUSPENDED_ADMIN: 'user_suspended_admin',
} as const;

export const SCREEN_NAMES = {
  AUTH: 'screen_view_auth',
  DASHBOARD: 'screen_view_dashboard',
  COMMUTE_PROFILE: 'screen_view_commute_profile',
  MATCH_DETAIL: 'screen_view_match_detail',
  TRIP_ACTIVE: 'screen_view_trip_active',
  TRIP_HISTORY: 'screen_view_trip_history',
  SUPPORT_TICKET: 'screen_view_support_ticket',
  ADMIN_VERIFICATIONS: 'screen_view_admin_verifications',
  ADMIN_INCIDENTS: 'screen_view_admin_incidents',
} as const;
