'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

interface Notification {
  notificationId: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  type: string;
}

interface PagedResult { items: Notification[]; totalCount: number; }

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<PagedResult>('/api/notifications?page=1&pageSize=30')
      .then(r => setItems(r.items ?? []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell title="Notifications">
      {loading && <NSkeleton />}
      {error && <div style={{ background: '#fff3f3', borderRadius: 12, padding: 16, color: '#c00', fontSize: 14 }}>⚠️ {error}</div>}
      {!loading && !error && items.length === 0 && (
        <div style={s.empty}>
          <span style={{ fontSize: 44 }}>🔕</span>
          <p style={{ fontWeight: 600, color: '#333', margin: 0 }}>All clear!</p>
          <p style={{ fontSize: 13, color: '#999', margin: 0 }}>You have no notifications</p>
        </div>
      )}
      {!loading && !error && items.map(n => <NotifCard key={n.notificationId} n={n} />)}
    </AppShell>
  );
}

function NotifCard({ n }: { n: Notification }) {
  const time = new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <div style={{ ...s.card, background: n.isRead ? '#fff' : '#f0f9f7' }}>
      <div style={s.cardRow}>
        <div style={s.dot(n.isRead)} />
        <div style={{ flex: 1 }}>
          <div style={s.title}>{n.title}</div>
          <div style={s.body}>{n.body}</div>
          <div style={s.time}>{time}</div>
        </div>
      </div>
    </div>
  );
}

function NSkeleton() {
  return (
    <>
      {[1,2,3,4].map(i => (
        <div key={i} style={{ ...s.card, gap: 8 }}>
          <div style={{ height: 13, background: '#e8e8e8', borderRadius: 6, width: '50%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
          <div style={{ height: 11, background: '#efefef', borderRadius: 6, width: '80%' }} />
        </div>
      ))}
      <style>{`@keyframes shimmer{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </>
  );
}

const s = {
  card:    { background: '#fff', borderRadius: 14, padding: '14px 16px', marginBottom: 10, border: '1px solid #f0f0f0' } as React.CSSProperties,
  cardRow: { display: 'flex', gap: 12, alignItems: 'flex-start' } as React.CSSProperties,
  dot:     (read: boolean): React.CSSProperties => ({ width: 8, height: 8, borderRadius: '50%', background: read ? '#ddd' : '#01696f', marginTop: 5, flexShrink: 0 }),
  title:   { fontWeight: 600, fontSize: 14, color: '#1a1a1a' } as React.CSSProperties,
  body:    { fontSize: 13, color: '#666', marginTop: 2 } as React.CSSProperties,
  time:    { fontSize: 11, color: '#bbb', marginTop: 4 } as React.CSSProperties,
  empty:   { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: 10, textAlign: 'center' } as React.CSSProperties,
};
