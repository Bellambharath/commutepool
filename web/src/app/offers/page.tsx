'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

function getToken() {
  // Tokens stored as cookies by otp-verify page
  const match = document.cookie.match(/(?:^|; )accessToken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function OffersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/auth/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div style={styles.splash}>
        <div style={styles.spinner} />
      </div>
    );
  }

  return (
    <div style={styles.shell}>
      {/* Header */}
      <header style={styles.header}>
        <span style={styles.logo}>🚗 CommutePool</span>
        <button style={styles.iconBtn} aria-label="Notifications">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </button>
      </header>

      {/* Body */}
      <main style={styles.main}>
        <h1 style={styles.heading}>Good morning 👋</h1>
        <p style={styles.sub}>Find a ride or offer your commute today.</p>

        {/* Quick actions */}
        <div style={styles.grid}>
          <QuickCard icon="🔍" label="Find a Ride" color="#e8f5e9" />
          <QuickCard icon="🚘" label="Offer a Ride" color="#e3f2fd" />
          <QuickCard icon="📅" label="My Bookings" color="#fce4ec" />
          <QuickCard icon="👤" label="Profile" color="#fff3e0" />
        </div>

        {/* Active offers placeholder */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Available Rides</h2>
          <EmptyState />
        </section>
      </main>

      {/* Bottom Nav */}
      <nav style={styles.bottomNav}>
        <NavItem icon="🏠" label="Home" active href="/offers" />
        <NavItem icon="🔍" label="Find" href="/offers" />
        <NavItem icon="🚘" label="Offer" href="/offers" />
        <NavItem icon="📋" label="Trips" href="/trips" />
        <NavItem icon="👤" label="Profile" href="/profile" />
      </nav>
    </div>
  );
}

function QuickCard({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <button style={{ ...styles.card, background: color }}>
      <span style={styles.cardIcon}>{icon}</span>
      <span style={styles.cardLabel}>{label}</span>
    </button>
  );
}

function NavItem({ icon, label, active, href }: { icon: string; label: string; active?: boolean; href: string }) {
  return (
    <a href={href} style={{ ...styles.navItem, ...(active ? styles.navItemActive : {}) }}>
      <span style={styles.navIcon}>{icon}</span>
      <span style={styles.navLabel}>{label}</span>
    </a>
  );
}

function EmptyState() {
  return (
    <div style={styles.empty}>
      <span style={{ fontSize: 40 }}>🚗</span>
      <p style={styles.emptyText}>No rides nearby yet.</p>
      <p style={styles.emptySubText}>Be the first to offer a commute!</p>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: { display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#f7f6f2', fontFamily: 'system-ui, sans-serif', maxWidth: 480, margin: '0 auto' },
  splash: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh' },
  spinner: { width: 36, height: 36, border: '3px solid #ddd', borderTopColor: '#01696f', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#fff', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 10 },
  logo: { fontWeight: 700, fontSize: 18, color: '#01696f' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#555' },
  main: { flex: 1, padding: '20px 16px 96px', overflowY: 'auto' },
  heading: { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' },
  sub: { fontSize: 14, color: '#777', margin: '0 0 24px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 },
  card: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px 12px', borderRadius: 16, border: 'none', cursor: 'pointer', transition: 'transform 0.15s' },
  cardIcon: { fontSize: 28 },
  cardLabel: { fontSize: 13, fontWeight: 600, color: '#333' },
  section: { marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, gap: 8 },
  emptyText: { fontSize: 15, fontWeight: 600, color: '#333', margin: 0 },
  emptySubText: { fontSize: 13, color: '#999', margin: 0 },
  bottomNav: { position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 480, display: 'flex', background: '#fff', borderTop: '1px solid #eee', zIndex: 20 },
  navItem: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 4px 12px', textDecoration: 'none', color: '#999', gap: 2 },
  navItemActive: { color: '#01696f' },
  navIcon: { fontSize: 20 },
  navLabel: { fontSize: 10, fontWeight: 500 },
};
