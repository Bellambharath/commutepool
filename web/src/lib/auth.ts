// Shared auth helpers
export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
  // Split on "; " to handle all cookie string formats reliably
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf('=');
    if (eqIdx === -1) continue;
    const name = cookie.slice(0, eqIdx).trim();
    if (name === 'accessToken') {
      return decodeURIComponent(cookie.slice(eqIdx + 1));
    }
  }
  return null;
}

export function clearTokens() {
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getAccessToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (res.status === 401) {
    clearTokens();
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
