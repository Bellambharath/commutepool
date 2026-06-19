/**
 * Typed fetch wrapper for the CommutePool API.
 * - Always credentials: 'include' so the httpOnly refresh_token cookie flows.
 * - Authenticated requests pass accessToken as Authorization: Bearer.
 * - withAuth() does one silent /auth/refresh retry on 401 before giving up.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
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

    const json = (await res.json()) as ApiResponse<T>;
    return json;
  } catch {
    return { success: false, data: null, error: 'Network error — please check your connection.' };
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
// 401-retry helper
// ---------------------------------------------------------------------------

export async function withAuth<T>(
  currentToken: string,
  fn: (token: string) => Promise<ApiResponse<T>>,
): Promise<{ result: ApiResponse<T>; newAccessToken: string | null }> {
  const first = await fn(currentToken);

  if (first.success || first.error !== 'Unauthorized') {
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
