// Shared auth helpers

export function getAccessToken(): string | null {
  if (typeof document === 'undefined') return null;
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

export function getRefreshToken(): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split('; ');
  for (const cookie of cookies) {
    const eqIdx = cookie.indexOf('=');
    if (eqIdx === -1) continue;
    const name = cookie.slice(0, eqIdx).trim();
    if (name === 'refreshToken') {
      return decodeURIComponent(cookie.slice(eqIdx + 1));
    }
  }
  return null;
}

export function setTokens(accessToken: string, refreshToken?: string) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `accessToken=${encodeURIComponent(accessToken)}; path=/; max-age=86400; SameSite=Lax${secure}`;
  if (refreshToken) {
    document.cookie = `refreshToken=${encodeURIComponent(refreshToken)}; path=/; max-age=2592000; SameSite=Lax${secure}`;
  }
}

export function clearTokens() {
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function tryRefreshToken(): Promise<string | null> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) return null;
    try {
      const res = await fetch('/api/auth/token/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      if (data.accessToken) {
        setTokens(data.accessToken, data.refreshToken);
        return data.accessToken as string;
      }
      return null;
    } catch {
      return null;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let token = getAccessToken();

  const doFetch = (t: string | null) =>
    fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(t ? { Authorization: `Bearer ${t}` } : {}),
        ...options?.headers,
      },
    });

  let res = await doFetch(token);

  // On 401, try a silent token refresh once before giving up
  if (res.status === 401) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      res = await doFetch(newToken);
    }
    // If still 401 after refresh attempt, clear cookies and go to login
    if (res.status === 401) {
      clearTokens();
      window.location.href = '/auth/login';
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as any)?.message || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
