// ─────────────────────────────────────────────────────────────────
// CommutePool — Shared Validation Rules
// Use these rules in all platforms. Do not redefine locally.
// ─────────────────────────────────────────────────────────────────

export const VALIDATION = {
  phone: {
    pattern: /^\+[1-9]\d{6,14}$/,  // E.164
    message: 'Enter a valid phone number with country code',
  },
  name: {
    minLength: 2,
    maxLength: 120,
  },
  workEmail: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  otp: {
    length: 6,
    pattern: /^\d{6}$/,
  },
  commute: {
    minWorkingDays: 1,
    maxDetourMinutes: 30,   // corridor can reduce this
    homeLabelMaxLength: 200,
    officeLabelMaxLength: 200,
  },
  offer: {
    availableSeats: { min: 1, max: 1 },  // v1: bikes only
  },
  rating: {
    min: 1,
    max: 5,
  },
  support: {
    subjectMinLength: 5,
    subjectMaxLength: 160,
    descriptionMaxLength: 1000,
  },
} as const;
