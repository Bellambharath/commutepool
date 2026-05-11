// ─────────────────────────────────────────────────────────────────
// CommutePool — Canonical Copy Keys and Terminology
// Use these constants for all user-facing labels.
// ─────────────────────────────────────────────────────────────────

// Core terminology — frozen, do not change without product decision
export const TERMINOLOGY = {
  bikeOwner: 'Bike owner',          // NOT 'driver'
  rider: 'Rider',
  contribution: 'Contribution',     // NOT 'fare'
  match: 'Match',                   // NOT 'booking'
  recurringCommute: 'Recurring commute',
  pickupOption: 'Pickup option',
  corridor: 'Corridor',
  commuteProfile: 'Commute profile',
  incident: 'Incident',
  support: 'Support',
} as const;

export const COPY = {
  cta: {
    acceptMatch: 'Accept match',
    rejectMatch: 'Decline match',
    continueOnPhone: 'Continue on phone',
    createOffer: 'Create offer',
    createRequest: 'Create request',
    startTrip: 'Start trip',
    completeTrip: 'Complete trip',
    triggerSos: 'SOS',
    raiseSupportTicket: 'Raise a support ticket',
    submitVerification: 'Submit for verification',
  },
  status: {
    trip: {
      SCHEDULED: 'Scheduled',
      ARRIVING: 'Arriving',
      STARTED: 'Trip started',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
      REPORTED: 'Reported',
    },
    verification: {
      NOT_STARTED: 'Not started',
      PENDING: 'Pending review',
      APPROVED: 'Verified',
      REJECTED: 'Rejected',
    },
    match: {
      PROPOSED: 'New match',
      PENDING_USER_ACTION: 'Awaiting your response',
      ACCEPTED: 'Matched',
      REJECTED: 'Declined',
      EXPIRED: 'Expired',
      RECURRING_ACTIVE: 'Recurring',
    },
  },
  messages: {
    offlineCached: 'Showing last synced data',
    noMatches: 'No matches yet. Check back after your offer is active.',
    noTrips: 'No trips yet.',
    verificationPending: 'Your documents are under review.',
    sosConfirm: 'This will alert your emergency contact and our safety team.',
  },
} as const;
