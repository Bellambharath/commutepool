// ─────────────────────────────────────────────────────────────────
// CommutePool — Design Tokens (source of truth)
// Web/Admin converts these to CSS custom properties.
// Android uses theme.kt derived from the same values.
// ─────────────────────────────────────────────────────────────────

export const COLOR = {
  // Brand
  primary: '#1A56DB',
  primaryDark: '#1240A8',
  onPrimary: '#FFFFFF',

  // Semantic
  success: '#0E9F6E',
  warning: '#FF5A1F',
  danger: '#E02424',
  info: '#3F83F8',

  // Surface
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceElevated: '#FFFFFF',
  border: '#E5E7EB',
  borderStrong: '#9CA3AF',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textDisabled: '#D1D5DB',
  textOnPrimary: '#FFFFFF',
  textDanger: '#E02424',
  textSuccess: '#0E9F6E',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
} as const;

export const MOTION = {
  fast: 150,      // small state transitions (ms)
  normal: 220,    // page/modal transitions
  slow: 320,
} as const;

export const STATUS_CHIP = {
  PENDING: { bg: '#FEF3C7', text: '#92400E', label: 'Pending review' },
  APPROVED: { bg: '#D1FAE5', text: '#065F46', label: 'Verified' },
  REJECTED: { bg: '#FEE2E2', text: '#991B1B', label: 'Rejected' },
  OPEN: { bg: '#FEE2E2', text: '#991B1B', label: 'Open' },
  UNDER_REVIEW: { bg: '#FEF3C7', text: '#92400E', label: 'Under review' },
  RESOLVED: { bg: '#D1FAE5', text: '#065F46', label: 'Resolved' },
  CRITICAL: { bg: '#991B1B', text: '#FFFFFF', label: 'Critical' },
  HIGH: { bg: '#FEE2E2', text: '#991B1B', label: 'High' },
  MEDIUM: { bg: '#FEF3C7', text: '#92400E', label: 'Medium' },
  LOW: { bg: '#F3F4F6', text: '#374151', label: 'Low' },
} as const;
