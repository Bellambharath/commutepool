'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function OtpVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get('phone') || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => { inputs.current[0]?.focus(); }, []);

  function handleChange(val: string, idx: number) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) inputs.current[idx + 1]?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputs.current[idx - 1]?.focus();
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}`, otp: code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as any)?.message || 'Invalid OTP. Please try again.');
      }
      const data = await res.json();

      // Write cookies BEFORE navigating so they're available on the next page
      if (data.accessToken) {
        document.cookie = `accessToken=${encodeURIComponent(data.accessToken)}; path=/; max-age=86400; SameSite=Lax`;
      }
      if (data.refreshToken) {
        document.cookie = `refreshToken=${encodeURIComponent(data.refreshToken)}; path=/; max-age=2592000; SameSite=Lax`;
      }

      // Use full navigation (not SPA router.push) so cookie is flushed before the
      // next page mounts and reads document.cookie
      window.location.href = '/offers';
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setLoading(false);
    }
  }

  const otpComplete = otp.every(d => d !== '');

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-label="CommutePool" style={{ marginBottom: '12px' }}>
          <circle cx="20" cy="20" r="20" fill="#01696f" />
          <circle cx="13" cy="22" r="4" fill="white" />
          <circle cx="27" cy="22" r="4" fill="white" />
          <path d="M11 19 Q20 12 29 19" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>

        <h2 style={styles.title}>Enter OTP</h2>
        <p style={styles.sub}>Sent to +91&nbsp;{phone}</p>

        <form onSubmit={handleVerify} style={{ width: '100%' }}>
          <div style={styles.otpRow}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleChange(e.target.value, i)}
                onKeyDown={e => handleKeyDown(e, i)}
                style={{
                  ...styles.otpBox,
                  borderColor: digit ? '#01696f' : '#e0e0e0',
                }}
              />
            ))}
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={!otpComplete || loading}
            style={{
              ...styles.btn,
              opacity: !otpComplete || loading ? 0.5 : 1,
              cursor: !otpComplete || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Verifying…' : 'Verify & Login'}
          </button>
        </form>

        <button onClick={() => router.push('/auth/login')} style={styles.back}>
          ← Change number
        </button>
      </div>
    </main>
  );
}

export default function OtpVerifyPage() {
  return (
    <Suspense>
      <OtpVerifyContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f7f4',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '16px',
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '40px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  title: { fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 6px' },
  sub:   { fontSize: '14px', color: '#888', margin: '0 0 28px' },
  otpRow: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    marginBottom: '4px',
  },
  otpBox: {
    width: '46px',
    height: '56px',
    textAlign: 'center',
    fontSize: '24px',
    fontWeight: 700,
    border: '2px solid',
    borderRadius: '10px',
    outline: 'none',
    transition: 'border-color 0.15s',
    color: '#1a1a1a',
  },
  btn: {
    width: '100%',
    marginTop: '20px',
    padding: '14px',
    background: '#01696f',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
  },
  error: { color: '#e53935', fontSize: '13px', marginTop: '10px', textAlign: 'center' },
  back:  { marginTop: '20px', background: 'none', border: 'none', color: '#01696f', fontSize: '14px', cursor: 'pointer', fontWeight: 500 },
};
