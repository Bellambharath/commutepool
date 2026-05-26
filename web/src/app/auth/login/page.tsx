'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Belt-and-suspenders: layout.tsx already sets force-dynamic globally,
// but keeping it here too ensures this page is never prerendered even if
// the layout changes in future.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+91${phone}` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || 'Failed to send OTP');
      }
      router.push(`/auth/otp-verify?phone=${encodeURIComponent(phone)}`);
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        {/* Logo */}
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-label="CommutePool" style={{ marginBottom: '12px' }}>
          <circle cx="20" cy="20" r="20" fill="#1B8A5A" />
          <circle cx="13" cy="22" r="4" fill="white" />
          <circle cx="27" cy="22" r="4" fill="white" />
          <rect x="10" y="14" width="20" height="11" rx="5" fill="white" opacity="0.2" />
          <path d="M11 19 Q20 12 29 19" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
        </svg>

        <h1 style={styles.title}>CommutePool</h1>
        <p style={styles.tagline}>Ride safe. Ride smart.</p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <label style={styles.label}>Mobile Number</label>
          <div style={styles.phoneRow}>
            <span style={styles.prefix}>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit number"
              style={styles.input}
              autoFocus
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button
            type="submit"
            disabled={phone.length !== 10 || loading}
            style={{
              ...styles.btn,
              opacity: phone.length !== 10 || loading ? 0.5 : 1,
              cursor: phone.length !== 10 || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Sending OTP…' : 'Get OTP'}
          </button>
        </form>
      </div>
    </main>
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
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1B8A5A',
    margin: '0 0 4px',
  },
  tagline: {
    fontSize: '14px',
    color: '#888',
    margin: '0 0 32px',
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#333',
    marginBottom: '8px',
  },
  phoneRow: {
    display: 'flex',
    border: '1.5px solid #e0e0e0',
    borderRadius: '10px',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  prefix: {
    padding: '13px 14px',
    background: '#f5f5f5',
    color: '#555',
    borderRight: '1.5px solid #e0e0e0',
    fontSize: '16px',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    padding: '13px 14px',
    fontSize: '16px',
    background: 'transparent',
    color: '#1a1a1a',
  },
  btn: {
    width: '100%',
    marginTop: '20px',
    padding: '14px',
    background: '#1B8A5A',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '16px',
    fontWeight: 600,
    transition: 'background 0.2s',
  },
  error: {
    color: '#e53935',
    fontSize: '13px',
    marginTop: '10px',
  },
};
