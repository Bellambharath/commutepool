'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

interface RideRequest {
  requestId: string;
  offerId: string;
  riderName: string;
  fromLocation: string;
  toLocation: string;
  requestedAt: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Cancelled';
}

interface PagedResult { items: RideRequest[]; totalCount: number; }

export default function RequestsPage() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PagedResult>('/api/requests?page=1&pageSize=30')
      .then(r => setRequests(r.items ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function respond(requestId: string, action: 'accept' | 'decline') {
    setActing(requestId);
    try {
      await apiFetch(`/api/requests/${requestId}/${action}`, { method: 'POST' });
      setRequests(rs => rs.map(r => r.requestId === requestId
        ? { ...r, status: action === 'accept' ? 'Accepted' : 'Declined' }
        : r
      ));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActing(null);
    }
  }

  return (
    <AppShell title="Ride Requests">
      {loading && <ReqSkeleton />}
      {error && <div style={{ background: '#fff3f3', borderRadius: 12, padding: 16, color: '#c00', fontSize: 14 }}>⚠️ {error}</div>}
      {!loading && !error && requests.length === 0 && (
        <div style={s.empty}>
          <span style={{ fontSize: 44 }}>📭</span>
          <p style={{ fontWeight: 600, color: '#333', margin: 0 }}>No requests yet</p>
          <p style={{ fontSize: 13, color: '#999', margin: 0 }}>When riders request your commute, they'll appear here</p>
        </div>
      )}
      {!loading && !error && requests.map(r => (
        <RequestCard key={r.requestId} req={r} acting={acting === r.requestId} onRespond={respond} />
      ))}
    </AppShell>
  );
}

function RequestCard({ req, acting, onRespond }: {
  req: RideRequest;
  acting: boolean;
  onRespond: (id: string, action: 'accept' | 'decline') => void;
}) {
  const date = new Date(req.requestedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const statusColor: Record<string, string> = { Pending: '#964219', Accepted: '#437a22', Declined: '#a12c7b', Cancelled: '#888' };
  const statusBg:    Record<string, string> = { Pending: '#fff3e0', Accepted: '#d4dfcc', Declined: '#e0ced7', Cancelled: '#eee' };

  return (
    <div style={s.card}>
      <div style={s.cardTop}>
        <div>
          <div style={s.riderName}>{req.riderName}</div>
          <div style={s.route}>{req.fromLocation} → {req.toLocation}</div>
          <div style={s.meta}>{date}</div>
        </div>
        <span style={{ ...s.badge, color: statusColor[req.status] || '#555', background: statusBg[req.status] || '#eee' }}>
          {req.status}
        </span>
      </div>
      {req.status === 'Pending' && (
        <div style={s.actions}>
          <button disabled={acting} onClick={() => onRespond(req.requestId, 'decline')} style={{ ...s.btn, ...s.btnDecline }}>
            {acting ? '…' : 'Decline'}
          </button>
          <button disabled={acting} onClick={() => onRespond(req.requestId, 'accept')} style={{ ...s.btn, ...s.btnAccept }}>
            {acting ? '…' : 'Accept'}
          </button>
        </div>
      )}
    </div>
  );
}

function ReqSkeleton() {
  return (
    <>
      {[1,2,3].map(i => (
        <div key={i} style={{ ...s.card, gap: 10 }}>
          <div style={{ height: 14, background: '#e8e8e8', borderRadius: 6, width: '55%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          <div style={{ height: 12, background: '#efefef', borderRadius: 6, width: '70%' }} />
        </div>
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  card:       { background: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' },
  cardTop:    { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  riderName:  { fontWeight: 700, fontSize: 14, color: '#1a1a1a' },
  route:      { fontSize: 12, color: '#777', marginTop: 3 },
  meta:       { fontSize: 12, color: '#bbb', marginTop: 2 },
  badge:      { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0 },
  actions:    { display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid #f5f5f5' },
  btn:        { flex: 1, padding: '10px', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' },
  btnAccept:  { background: '#01696f', color: '#fff' },
  btnDecline: { background: '#f3f3f3', color: '#555' },
  empty:      { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10, textAlign: 'center' },
};
