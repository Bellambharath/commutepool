/**
 * Typed fetch wrapper for the CommutePool API.
 * - Always credentials: 'include' so the httpOnly refresh_token cookie flows.
 * - Authenticated requests pass accessToken as Authorization: Bearer.
 * - withAuth() does one silent /auth/refresh retry on 401 before giving up.
 *   Retry is keyed on HTTP status 401, not on any particular error string,
 *   so it handles all three middleware variants:
 *     'Authorization header missing or malformed'
 *     'Invalid or expired access token'
 *     'Unauthorized'
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
  /** HTTP status code. 0 means a network/transport error (no response received). */
  status: number;
}

interface FetchOptions extends RequestInit {
  accessToken?: string;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
): Promise<ApiResponse<T>> {
  const { accessToken, headers: extraHeaders, ...rest } = options;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(extraHeaders as Record<string, string> | undefined),
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...rest,
      headers,
      credentials: 'include',
    });

    const json = (await res.json()) as Omit<ApiResponse<T>, 'status'>;
    return { ...json, status: res.status };
  } catch {
    return { success: false, data: null, error: 'Network error — please check your connection.', status: 0 };
  }
}

// ---------------------------------------------------------------------------
// Typed callers
// ---------------------------------------------------------------------------

export interface RequestOtpData { message: string }

export async function requestOtp(phone: string): Promise<ApiResponse<RequestOtpData>> {
  return apiFetch<RequestOtpData>('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export interface AuthUser {
  id: string;
  phone: string;
  name: string;
  role: 'RIDER' | 'OWNER' | 'BOTH';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
}

export interface VerifyOtpData {
  accessToken: string;
  isNewUser: boolean;
  user: AuthUser;
}

export async function verifyOtp(phone: string, otp: string): Promise<ApiResponse<VerifyOtpData>> {
  return apiFetch<VerifyOtpData>('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
}

export interface RefreshData { accessToken: string }

export async function refreshAccessToken(): Promise<ApiResponse<RefreshData>> {
  return apiFetch<RefreshData>('/auth/refresh', { method: 'POST' });
}

export interface MeUser {
  id: string;
  phone: string;
  name: string;
  photo_url: string | null;
  role: 'RIDER' | 'OWNER' | 'BOTH';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  cancellation_strikes: number;
  created_at: string;
  updated_at: string;
}

export interface MeData {
  user: MeUser;
  bikeOwnerProfile: unknown | null;
}

export async function getMe(accessToken: string): Promise<ApiResponse<MeData>> {
  return apiFetch<MeData>('/users/me', { accessToken });
}

export interface ProfileBody {
  name: string;
  role: 'RIDER' | 'OWNER' | 'BOTH';
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface ProfileData { user: MeUser }

export async function updateProfile(
  accessToken: string,
  body: ProfileBody,
): Promise<ApiResponse<ProfileData>> {
  return apiFetch<ProfileData>('/users/profile', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
}

export async function logout(accessToken: string): Promise<ApiResponse<{ message: string }>> {
  return apiFetch<{ message: string }>('/auth/logout', {
    method: 'POST',
    accessToken,
  });
}

// ---------------------------------------------------------------------------
// Places & Routes
// ---------------------------------------------------------------------------

export interface PlaceResult {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  lat: number;
  lng: number;
}

export async function searchPlaces(
  query: string,
  accessToken: string,
): Promise<ApiResponse<{ places: PlaceResult[] }>> {
  return apiFetch<{ places: PlaceResult[] }>(
    `/places/search?q=${encodeURIComponent(query)}`,
    { accessToken },
  );
}

export interface RouteOption {
  encodedPolyline: string;
  distanceMeters: number;
  durationSeconds: number;
  routeLabel: string;
}

export async function getGoogleRoutes(
  originPlaceId: string,
  destinationPlaceId: string,
  accessToken: string,
): Promise<ApiResponse<{ routes: RouteOption[] }>> {
  return apiFetch<{ routes: RouteOption[] }>(
    `/routes/google?originPlaceId=${encodeURIComponent(originPlaceId)}&destinationPlaceId=${encodeURIComponent(destinationPlaceId)}`,
    { accessToken },
  );
}

export interface CreateRouteBody {
  period: 'MORNING' | 'EVENING';
  sourcePlaceId: string;
  sourceLat: number;
  sourceLng: number;
  sourceAddress: string;
  destinationPlaceId: string;
  destinationLat: number;
  destinationLng: number;
  destinationAddress: string;
  encodedPolyline: string;
  distanceMeters: number;
  durationSeconds: number;
  routeLabel?: string;
  isPrimary: boolean;
}

export async function createRoute(
  body: CreateRouteBody,
  accessToken: string,
): Promise<ApiResponse<{ route: unknown }>> {
  return apiFetch<{ route: unknown }>('/routes', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Commute Routes
// ---------------------------------------------------------------------------

export interface CommuteRoute {
  id: string;
  period: 'MORNING' | 'EVENING';
  route_label: string | null;
  source_address: string;
  destination_address: string;
  distance_meters: number;
  duration_seconds: number;
  is_primary: boolean;
}

export async function getMyRoutes(
  accessToken: string,
  period?: 'MORNING' | 'EVENING',
): Promise<ApiResponse<{ routes: CommuteRoute[] }>> {
  const query = period ? `?period=${period}` : '';
  return apiFetch<{ routes: CommuteRoute[] }>(`/routes${query}`, { accessToken });
}

// ---------------------------------------------------------------------------
// Offers
// ---------------------------------------------------------------------------

export interface CreateOfferBody {
  routeId: string;
  period: 'MORNING' | 'EVENING';
  weekStartDate: string;
  daysAvailable: number[];
  departureWindowStart: string;
  departureWindowEnd: string;
  seatsAvailable?: number;
}

export async function createOffer(
  body: CreateOfferBody,
  accessToken: string,
): Promise<ApiResponse<{ offer: unknown }>> {
  return apiFetch<{ offer: unknown }>('/offers', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Rider Requests
// ---------------------------------------------------------------------------

export interface CreateRequestBody {
  period: 'MORNING' | 'EVENING';
  weekStartDate: string;
  daysNeeded: number[];
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  pickupPlaceId: string;
  dropoffLat: number;
  dropoffLng: number;
  dropoffAddress: string;
  dropoffPlaceId: string;
  departureWindowStart: string;
  departureWindowEnd: string;
}

export async function createRequest(
  body: CreateRequestBody,
  accessToken: string,
): Promise<ApiResponse<{ request: unknown }>> {
  return apiFetch<{ request: unknown }>('/requests', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Matches & Bookings
// ---------------------------------------------------------------------------

export interface MatchOffer {
  id: string;
  owner_id: string;
  period: 'MORNING' | 'EVENING';
  days_available: number[];
  departure_window_start: string;
  departure_window_end: string;
  week_start_date: string;
  route: {
    source_address: string;
    destination_address: string;
    distance_meters: number;
  };
}

export interface MatchRequest {
  id: string;
  days_needed: number[];
  pickup_address: string;
  dropoff_address: string;
  week_start_date: string;
}

export interface MatchBooking {
  id: string;
  status: string;
}

/** Subset type — the API returns more fields; this covers what the UI needs. */
export interface Match {
  id: string;
  offer_id: string;
  request_id: string;
  compatibility_score: number;
  total_contribution_paise: number;
  pickup_walk_meters: number;
  dropoff_walk_meters: number;
  is_partial_route: boolean;
  route_usage_percentage: number;
  created_at: string;
  offer: MatchOffer;
  request: MatchRequest;
  bookings: MatchBooking[];
}

export async function getMatches(
  accessToken: string,
  week?: string,
): Promise<ApiResponse<{ matches: Match[] }>> {
  const query = week ? `?week=${encodeURIComponent(week)}` : '';
  return apiFetch<{ matches: Match[] }>(`/matches${query}`, { accessToken });
}

export interface CreateBookingBody {
  matchId: string;
  daysConfirmed: number[];
}

export async function createBooking(
  body: CreateBookingBody,
  accessToken: string,
): Promise<ApiResponse<{ booking: unknown }>> {
  return apiFetch<{ booking: unknown }>('/bookings', {
    method: 'POST',
    accessToken,
    body: JSON.stringify(body),
  });
}

export async function acceptBooking(
  bookingId: string,
  accessToken: string,
): Promise<ApiResponse<{ booking: unknown }>> {
  return apiFetch<{ booking: unknown }>(`/bookings/${bookingId}/accept`, {
    method: 'POST',
    accessToken,
  });
}

export async function rejectBooking(
  bookingId: string,
  accessToken: string,
): Promise<ApiResponse<{ booking: unknown }>> {
  return apiFetch<{ booking: unknown }>(`/bookings/${bookingId}/reject`, {
    method: 'POST',
    accessToken,
  });
}

// ---------------------------------------------------------------------------
// 401-retry helper
// ---------------------------------------------------------------------------

/**
 * Calls fn(currentToken). If the response has HTTP status 401 — regardless
 * of which error string the middleware returned — silently calls
 * POST /auth/refresh once, then replays fn with the new token.
 *
 * Returns the final ApiResponse plus the new token if a refresh occurred
 * (so the caller can update in-memory state).
 */
export async function withAuth<T>(
  currentToken: string,
  fn: (token: string) => Promise<ApiResponse<T>>,
): Promise<{ result: ApiResponse<T>; newAccessToken: string | null }> {
  const first = await fn(currentToken);

  if (first.status !== 401) {
    return { result: first, newAccessToken: null };
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed.success || !refreshed.data) {
    return { result: first, newAccessToken: null };
  }

  const newToken = refreshed.data.accessToken;
  const retried = await fn(newToken);
  return { result: retried, newAccessToken: newToken };
}
