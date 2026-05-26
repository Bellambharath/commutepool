'use client';
import AppShell from '@/components/AppShell';

export default function SafetyPage() {
  return (
    <AppShell title="Safety">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={s.card}>
          <div style={s.icon}>🆘</div>
          <div>
            <div style={s.title}>SOS Emergency</div>
            <div style={s.desc}>Send an emergency alert to your contacts and CommutePool team</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.icon}>📣</div>
          <div>
            <div style={s.title}>Report an Incident</div>
            <div style={s.desc}>Report unsafe behaviour or a trip issue</div>
          </div>
        </div>
        <div style={s.card}>
          <div style={s.icon}>🔒</div>
          <div>
            <div style={s.title}>Safety Tips</div>
            <div style={s.desc}>Read our guidelines for safe commute pooling</div>
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
