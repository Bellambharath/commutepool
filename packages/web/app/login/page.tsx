'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

const PHONE_RE = /^\+91[6-9]\d{9}$/;
const OTP_RE = /^\d{6}$/;
type Step = 'phone' | 'otp';

export default function LoginPage() {
  const { status, user, requestOtp, verifyOtp } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  // Single redirect authority for this page.
  // Handles BOTH cases:
  //   1. Returning user — bootstrap() resolves to 'authed' -> effect fires.
  //   2. Just-verified user — verifyOtp() sets status='authed'+user -> same effect fires.
  // user.status === 'PENDING' is true for every new user (backend creates as PENDING),
  // so this correctly sends new/incomplete users to /profile-setup.
  useEffect(() => {
    if (status !== 'authed' || !user) return;
    if (user.status === 'PENDING') {
      router.replace('/profile-setup');
    } else {
      router.replace('/home');
    }
  }, [status, user, router]);

  useEffect(() => {
    if (retryAfter === null || retryAfter <= 0) return;
    const id = setInterval(() => {
      setRetryAfter((prev) => (prev !== null && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(id);
  }, [retryAfter]);

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const trimmed = phone.trim();
    if (!PHONE_RE.test(trimmed)) {
      setError('Enter a valid Indian mobile number starting with +91.');
      return;
    }
    setLoading(true);
    const res = await requestOtp(trimmed);
    setLoading(false);
    if (res.success) {
      setStep('otp');
    } else {
      const match = res.error?.match(/(\d+) seconds/);
      if (match) setRetryAfter(parseInt(match[1], 10));
      setError(res.error ?? 'Failed to send OTP. Please try again.');
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!OTP_RE.test(otp)) {
      setError('Enter the 6-digit OTP sent to your phone.');
      return;
    }
    setLoading(true);
    const res = await verifyOtp(phone.trim(), otp.trim());
    setLoading(false);
    // Routing is handled entirely by the useEffect above which reacts to
    // the status + user changes that verifyOtp() sets on the context.
    // This function only handles the error case.
    if (!res.success) {
      setError(res.error ?? 'Incorrect OTP. Please try again.');
    }
  }

  if (status === 'loading') return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
              <circle cx="18.5" cy="17.5" r="2.5" />
              <circle cx="5.5" cy="17.5" r="2.5" />
              <path d="M15 17.5H9m9 0V9l-4-4H5l-3 3v7h2" />
              <path d="M9 17.5V11h6" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CommutePool</h1>
          <p className="mt-1 text-sm text-gray-500">Bike-pillion commutes, Hyderabad</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
          {step === 'phone' ? (
            <form onSubmit={handleRequestOtp} noValidate>
              <h2 className="mb-1 text-lg font-semibold text-gray-900">Sign in</h2>
              <p className="mb-5 text-sm text-gray-500">
                Enter your mobile number to receive a one-time password.
              </p>

              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">
                Mobile number
              </label>
              <input
                id="phone" type="tel" inputMode="numeric" autoComplete="tel"
                placeholder="+91XXXXXXXXXX" value={phone}
                onChange={(e) => { setError(null); setPhone(e.target.value); }}
                className="mb-4 block w-full rounded-xl border border-gray-300 px-4 py-3 text-base
                           placeholder-gray-400 focus:border-brand focus:outline-none
                           focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
                disabled={loading}
                aria-describedby={error ? 'phone-error' : undefined}
              />

              {error && (
                <p id="phone-error" role="alert" className="mb-4 text-sm text-red-600">
                  {error}{retryAfter !== null && retryAfter > 0 && ` Retry in ${retryAfter}s.`}
                </p>
              )}

              <button type="submit"
                disabled={loading || (retryAfter !== null && retryAfter > 0)}
                className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                           text-base font-semibold text-white transition-colors
                           hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50">
                {loading
                  ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} noValidate>
              <button type="button"
                onClick={() => { setStep('phone'); setOtp(''); setError(null); }}
                className="mb-4 flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                Back
              </button>

              <h2 className="mb-1 text-lg font-semibold text-gray-900">Enter OTP</h2>
              <p className="mb-5 text-sm text-gray-500">
                We sent a 6-digit code to{' '}
                <span className="font-medium text-gray-700">{phone}</span>.
              </p>

              <label htmlFor="otp" className="mb-1 block text-sm font-medium text-gray-700">
                One-time password
              </label>
              <input
                id="otp" type="text" inputMode="numeric" autoComplete="one-time-code"
                placeholder="000000" maxLength={6} value={otp}
                onChange={(e) => { setError(null); setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); }}
                className="mb-4 block w-full rounded-xl border border-gray-300 px-4 py-3 text-center
                           text-2xl font-bold tracking-widest placeholder-gray-300
                           focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30
                           disabled:opacity-50"
                disabled={loading}
                aria-describedby={error ? 'otp-error' : undefined}
              />

              {error && (
                <p id="otp-error" role="alert" className="mb-4 text-sm text-red-600">{error}</p>
              )}

              <button type="submit" disabled={loading || otp.length !== 6}
                className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                           text-base font-semibold text-white transition-colors
                           hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50">
                {loading
                  ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  : 'Verify OTP'}
              </button>

              <button type="button"
                onClick={() => handleRequestOtp({ preventDefault: () => {} } as React.FormEvent)}
                disabled={loading || (retryAfter !== null && retryAfter > 0)}
                className="mt-3 w-full text-center text-sm text-gray-500 hover:text-brand disabled:opacity-50">
                {retryAfter !== null && retryAfter > 0
                  ? `Resend OTP in ${retryAfter}s`
                  : 'Resend OTP'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
