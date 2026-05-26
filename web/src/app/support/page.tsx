'use client';
import AppShell from '@/components/AppShell';

export default function SupportPage() {
  return (
    <AppShell title="Support">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={s.card}>
          <div style={s.icon}>🎧</div>
          <div>
            <div style={s.title}>Contact Support</div>
            <div style={s.desc}>Reach our support team for help with your rides or account</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.icon}>📋</div>
          <div>
            <div style={s.title}>My Tickets</div>
            <div style={s.desc}>View the status of your open support tickets</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.icon}>❓</div>
          <div>
            <div style={s.title}>FAQ</div>
            <div style={s.desc}>Quick answers to common questions</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const s: Record<string, React.CSSProperties> = {
  card:  { display: 'flex', gap: 14, alignItems: 'flex-start', background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #f0f0f0', cursor: 'pointer' },
  icon:  { fontSize: 28, flexShrink: 0 },
  title: { fontWeight: 700, fontSize: 15, color: '#1a1a1a', marginBottom: 4 },
  desc:  { fontSize: 13, color: '#777' },
};
