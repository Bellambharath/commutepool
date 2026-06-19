'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  requestOtp as apiRequestOtp,
  verifyOtp as apiVerifyOtp,
  refreshAccessToken,
  getMe,
  logout as apiLogout,
  withAuth,
  type MeUser,
  type ApiResponse,
  type VerifyOtpData,
} from './api';

export type AuthStatus = 'loading' | 'authed' | 'anon';

export interface AuthContextValue {
  status: AuthStatus;
  user: MeUser | null;
  accessToken: string | null;
  requestOtp: (phone: string) => Promise<ApiResponse<{ message: string }>>;
  verifyOtp: (phone: string, otp: string) => Promise<ApiResponse<VerifyOtpData>>;
  setUser: (user: MeUser) => void;
  setAccessToken: (token: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUserState] = useState<MeUser | null>(null);
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    async function bootstrap() {
      const refreshRes = await refreshAccessToken();

      if (!refreshRes.success || !refreshRes.data) {
        setStatus('anon');
        return;
      }

      const token = refreshRes.data.accessToken;
      setAccessTokenState(token);

      // Use withAuth so that if the freshly-issued access token is somehow
      // already stale (clock skew, very short TTL), we do one silent retry
      // before giving up. If withAuth had to refresh again, store the newer
      // token so the rest of the session uses it.
      const { result: meRes, newAccessToken } = await withAuth(token, getMe);

      if (newAccessToken) {
        setAccessTokenState(newAccessToken);
      }

      if (meRes.success && meRes.data) {
        setUserState(meRes.data.user);
      }

      setStatus('authed');
    }

    bootstrap();
  }, []);

  const requestOtp = useCallback(
    (phone: string) => apiRequestOtp(phone),
    [],
  );

  const verifyOtp = useCallback(async (phone: string, otp: string) => {
    const res = await apiVerifyOtp(phone, otp);

    if (res.success && res.data) {
      setAccessTokenState(res.data.accessToken);
      const meRes = await getMe(res.data.accessToken);
      if (meRes.success && meRes.data) {
        setUserState(meRes.data.user);
      } else {
        // Fallback to limited verify-otp fields
        setUserState({
          ...res.data.user,
          photo_url: null,
          emergency_contact_name: null,
          emergency_contact_phone: null,
          cancellation_strikes: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      setStatus('authed');
    }

    return res;
  }, []);

  const setUser = useCallback((u: MeUser) => setUserState(u), []);
  const setAccessToken = useCallback((t: string) => setAccessTokenState(t), []);

  const logout = useCallback(async () => {
    if (accessToken) await apiLogout(accessToken);
    setAccessTokenState(null);
    setUserState(null);
    setStatus('anon');
  }, [accessToken]);

  return (
    <AuthContext.Provider
      value={{ status, user, accessToken, requestOtp, verifyOtp, setUser, setAccessToken, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
