'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

interface Trip {
  tripId: string;
  partnerName: string;
  fromLocation: string;
  toLocation: string;
  startedAt: string;
  completedAt?: string;
  status: 'Active' | 'Completed' | 'Cancelled' | 'NoShow';
  role: 'Owner' | 'Rider';
}

interface PagedResult { items: Trip[]; totalCount: number; }

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PagedResult>('/api/trips?page=1&pageSize=30')
      .then(r => setTrips(r.items ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="My Trips">
      {loading && <TripSkeleton />}
      {error && <ErrorCard msg={error} />}
      {!loading && !error && trips.length === 0 && (
        <div style={s.empty}>
          <span style={{ fontSize: 44 }}>🛺</span>
          <p style={{ fontWeight: 600, color: '#333', margin: 0 }}>No trips yet</p>
          <p style={{ fontSize: 13, color: '#999', margin: 0 }}>Your completed rides will appear here</p>
        </div>
      )}
      {!loading && !error && trips.map(t => <TripCard key={t.tripId} trip={t} />)}
    </AppShell>
  );
}

function TripCard({ trip }: { trip: Trip }) {
  const date = new Date(trip.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const time = new Date(trip.startedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const statusColor: Record<string, string> = { Active: '#01696f', Completed: '#437a22', Cancelled: '#a12c7b', NoShow: '#964219' };
  const statusBg:    Record<string, string> = { Active: '#e8f5f0', Completed: '#d4dfcc', Cancelled: '#e0ced7', NoShow: '#ddcfc6' };
  return (
    <a href={`/trips/${trip.tripId}`} style={s.card}>
      <div style={s.cardTop}>
        <div>
          <div style={s.cardRoute}>{trip.fromLocation} → {trip.toLocation}</div>
          <div style={s.cardMeta}>{date} · {time} · {trip.role}</div>
        </div>
        <span style={{ ...s.badge, color: statusColor[trip.status] || '#555', background: statusBg[trip.status] || '#eee' }}>
          {trip.status}
        </span>
      </div>
      {trip.partnerName && (
        <div style={s.partner}>👤 {trip.partnerName}</div>
      )}
    </a>
  );
}

function TripSkeleton() {
  return (
    <>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ ...s.card, gap: 10 }}>
          <div style={{ height: 14, background: '#e8e8e8', borderRadius: 6, width: '70%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          <div style={{ height: 12, background: '#efefef', borderRadius: 6, width: '40%' }} />
        </div>
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </>
  );
}

function ErrorCard({ msg }: { msg: string }) {
  return <div style={{ background: '#fff3f3', border: '1px solid #fcc', borderRadius: 12, padding: '16px', color: '#c00', fontSize: 14 }}>⚠️ {msg}</div>;
}

const s: Record<string, React.CSSProperties> = {
  card:      { display: 'block', background: '#fff', borderRadius: 16, padding: '16px', marginBottom: 12, textDecoration: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardTop:   { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  cardRoute: { fontWeight: 600, fontSize: 14, color: '#1a1a1a' },
  cardMeta:  { fontSize: 12, color: '#888', marginTop: 4 },
  badge:     { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
  partner:   { fontSize: 13, color: '#555', marginTop: 10, paddingTop: 10, borderTop: '1px solid #f5f5f5' },
  empty:     { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10, textAlign: 'center' },
};
