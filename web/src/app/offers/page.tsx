'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

// Prevent Vercel CDN from caching this page — middleware must run on every request
export const dynamic = 'force-dynamic';

interface Offer {
  offerId: string;
  ownerName: string;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  availableSeats: number;
  trustScore: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Offer[]>('/api/offers/available')
      .then(setOffers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppShell title="CommutePool" rightAction={
      <a href="/notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: '#555', textDecoration: 'none' }} aria-label="Notifications">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
      </a>
    }>
      <h1 style={s.greeting}>{greeting} 👋</h1>
      <p style={s.sub}>Find a ride or offer your commute today.</p>

      {/* Quick Actions */}
      <div style={s.quickGrid}>
        <a href="/commute" style={{ ...s.quickCard, background: '#e8f5f0' }}>
          <span style={s.quickIcon}>🛣️</span>
          <span style={s.quickLabel}>My Commute</span>
        </a>
        <a href="/requests" style={{ ...s.quickCard, background: '#e3f2fd' }}>
          <span style={s.quickIcon}>🔍</span>
          <span style={s.quickLabel}>Find Rides</span>
        </a>
        <a href="/trips" style={{ ...s.quickCard, background: '#fce4ec' }}>
          <span style={s.quickIcon}>📋</span>
          <span style={s.quickLabel}>My Trips</span>
        </a>
        <a href="/profile" style={{ ...s.quickCard, background: '#fff3e0' }}>
          <span style={s.quickIcon}>👤</span>
          <span style={s.quickLabel}>Profile</span>
        </a>
      </div>

      {/* Available Rides */}
      <section>
        <h2 style={s.sectionTitle}>Available Rides</h2>
        {loading && <Skeleton />}
        {error && <ErrorCard msg={error} />}
        {!loading && !error && offers.length === 0 && <EmptyState />}
        {!loading && !error && offers.map(o => <OfferCard key={o.offerId} offer={o} />)}
      </section>
    </AppShell>
  );
}

function OfferCard({ offer }: { offer: Offer }) {
  const time = new Date(offer.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return (
    <a href={`/offers/${offer.offerId}`} style={s.card}>
      <div style={s.cardRow}>
        <div style={s.avatar}>{offer.ownerName?.[0]?.toUpperCase() ?? '?'}</div>
        <div style={{ flex: 1 }}>
          <div style={s.cardName}>{offer.ownerName}</div>
          <div style={s.cardRoute}>{offer.fromLocation} → {offer.toLocation}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={s.cardTime}>{time}</div>
          <div style={s.cardSeats}>🪑 {offer.availableSeats} seat{offer.availableSeats !== 1 ? 's' : ''}</div>
        </div>
      </div>
      <div style={s.cardFooter}>
        <span style={s.trustBadge}>⭐ {offer.trustScore?.toFixed(1) ?? '—'}</span>
        <span style={s.requestBtn}>Request →</span>
      </div>
    </a>
  );
}

function Skeleton() {
  return (
    <>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ ...s.card, gap: 12 }}>
          <div style={{ height: 16, background: '#e8e8e8', borderRadius: 8, width: '60%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          <div style={{ height: 12, background: '#efefef', borderRadius: 8, width: '40%' }} />
        </div>
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </>
  );
}

function EmptyState() {
  return (
    <div style={s.empty}>
      <span style={{ fontSize: 44 }}>🛵</span>
      <p style={{ fontWeight: 600, color: '#333', margin: 0 }}>No rides available right now</p>
      <p style={{ fontSize: 13, color: '#999', margin: 0 }}>Check back later or set up your commute profile</p>
      <a href="/commute" style={s.emptyBtn}>Set up commute →</a>
    </div>
  );
}

function ErrorCard({ msg }: { msg: string }) {
  return <div style={{ background: '#fff3f3', border: '1px solid #fcc', borderRadius: 12, padding: '16px', color: '#c00', fontSize: 14 }}>⚠️ {msg}</div>;
}

const s: Record<string, React.CSSProperties> = {
  greeting:    { fontSize: 22, fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px' },
  sub:         { fontSize: 14, color: '#777', margin: '0 0 24px' },
  quickGrid:   { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28 },
  quickCard:   { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '18px 12px', borderRadius: 16, textDecoration: 'none' },
  quickIcon:   { fontSize: 26 },
  quickLabel:  { fontSize: 12, fontWeight: 600, color: '#333' },
  sectionTitle:{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 },
  card:        { display: 'block', background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardRow:     { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 },
  avatar:      { width: 40, height: 40, borderRadius: '50%', background: '#01696f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, flexShrink: 0 },
  cardName:    { fontWeight: 600, fontSize: 14, color: '#1a1a1a' },
  cardRoute:   { fontSize: 12, color: '#777', marginTop: 2 },
  cardTime:    { fontWeight: 700, fontSize: 14, color: '#01696f' },
  cardSeats:   { fontSize: 12, color: '#888', marginTop: 2 },
  cardFooter:  { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f5f5f5', paddingTop: 10 },
  trustBadge:  { fontSize: 12, color: '#555' },
  requestBtn:  { fontSize: 13, fontWeight: 600, color: '#01696f' },
  empty:       { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', background: '#fff', borderRadius: 16, gap: 10, textAlign: 'center' },
  emptyBtn:    { marginTop: 4, padding: '10px 20px', background: '#01696f', color: '#fff', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 },
};
