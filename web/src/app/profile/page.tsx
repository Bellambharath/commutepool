'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch, clearTokens } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface UserProfile {
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  trustScore: number;
  isVerified: boolean;
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<UserProfile>('/api/users/me')
      .then(setProfile)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() {
    clearTokens();
    router.replace('/auth/login');
  }

  return (
    <AppShell title="Profile">
      {loading && <ProfileSkeleton />}
      {error && <div style={{ background: '#fff3f3', border: '1px solid #fcc', borderRadius: 12, padding: 16, color: '#c00', fontSize: 14 }}>⚠️ {error}</div>}
      {!loading && !error && profile && (
        <>
          {/* Avatar + Name */}
          <div style={s.hero}>
            <div style={s.avatar}>{profile.fullName?.[0]?.toUpperCase() ?? '?'}</div>
            <div style={s.name}>{profile.fullName}</div>
            <div style={s.phone}>{profile.phone}</div>
            <div style={s.badges}>
              <span style={{ ...s.badge, background: '#e8f5f0', color: '#01696f' }}>⭐ {profile.trustScore?.toFixed(1) ?? '—'}</span>
              {profile.isVerified && <span style={{ ...s.badge, background: '#d4dfcc', color: '#437a22' }}>✓ Verified</span>}
            </div>
          </div>

          {/* Menu */}
          <div style={s.menu}>
            <MenuItem icon="🛣️" label="Commute Profile" href="/commute" />
            <MenuItem icon="📋" label="My Trips" href="/trips" />
            <MenuItem icon="🔍" label="Ride Requests" href="/requests" />
            <MenuItem icon="🔔" label="Notifications" href="/notifications" />
            <MenuItem icon="🛡️" label="Safety" href="/safety" />
            <MenuItem icon="🎧" label="Support" href="/support" />
          </div>

          {/* Member since */}
          <p style={s.since}>Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>

          {/* Logout */}
          <button onClick={handleLogout} style={s.logout}>Log out</button>
        </>
      )}
    </AppShell>
  );
}

function MenuItem({ icon, label, href }: { icon: string; label: string; href: string }) {
  return (
    <a href={href} style={s.menuItem}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={s.menuLabel}>{label}</span>
      <span style={s.chevron}>›</span>
    </a>
  );
}

function ProfileSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingTop: 20 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#e8e8e8', animation: 'shimmer 1.4s ease-in-out infinite' }} />
      <div style={{ height: 16, width: 140, background: '#e8e8e8', borderRadius: 8 }} />
      <div style={{ height: 12, width: 100, background: '#efefef', borderRadius: 8 }} />
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  hero:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 20px', gap: 6 },
  avatar:   { width: 80, height: 80, borderRadius: '50%', background: '#01696f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 700 },
  name:     { fontSize: 20, fontWeight: 700, color: '#1a1a1a' },
  phone:    { fontSize: 14, color: '#888' },
  badges:   { display: 'flex', gap: 8, marginTop: 4 },
  badge:    { fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20 },
  menu:     { background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #f0f0f0', marginBottom: 16 },
  menuItem: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textDecoration: 'none', color: '#1a1a1a', borderBottom: '1px solid #f5f5f5' },
  menuLabel:{ flex: 1, fontSize: 14, fontWeight: 500 },
  chevron:  { color: '#bbb', fontSize: 20 },
  since:    { fontSize: 12, color: '#aaa', textAlign: 'center', margin: '8px 0 16px' },
  logout:   { width: '100%', padding: '14px', background: '#fff', color: '#a12c7b', border: '1.5px solid #e0d0d8', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
};
