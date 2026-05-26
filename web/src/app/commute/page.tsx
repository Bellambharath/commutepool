'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

interface CommuteProfile {
  profileId?: string;
  fromLocation: string;
  toLocation: string;
  departureTime: string;
  returnTime?: string;
  daysOfWeek: string[];
  role: 'Owner' | 'Rider' | 'Both';
  status: 'Active' | 'Paused';
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function CommutePage() {
  const [profile, setProfile] = useState<CommuteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch<CommuteProfile>('/api/commute/profile')
      .then(setProfile)
      .catch(() => {
        // 404 = not set up yet, show empty form
        setProfile({ fromLocation: '', toLocation: '', departureTime: '09:00', daysOfWeek: ['Mon','Tue','Wed','Thu','Fri'], role: 'Rider', status: 'Active' });
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await apiFetch('/api/commute/profile', { method: 'PUT', body: JSON.stringify(profile) });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function togglePause() {
    if (!profile) return;
    const endpoint = profile.status === 'Active' ? '/api/commute/profile/pause' : '/api/commute/profile/resume';
    try {
      await apiFetch(endpoint, { method: 'POST' });
      setProfile(p => p ? { ...p, status: p.status === 'Active' ? 'Paused' : 'Active' } : p);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function update<K extends keyof CommuteProfile>(key: K, value: CommuteProfile[K]) {
    setProfile(p => p ? { ...p, [key]: value } : p);
  }

  function toggleDay(day: string) {
    if (!profile) return;
    const days = profile.daysOfWeek.includes(day)
      ? profile.daysOfWeek.filter(d => d !== day)
      : [...profile.daysOfWeek, day];
    update('daysOfWeek', days);
  }

  return (
    <AppShell title="Commute Profile">
      {loading && <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>Loading…</div>}
      {!loading && profile && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Status badge + toggle */}
          {profile.profileId && (
            <div style={s.statusRow}>
              <span style={{ ...s.statusDot, background: profile.status === 'Active' ? '#437a22' : '#964219' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: profile.status === 'Active' ? '#437a22' : '#964219' }}>{profile.status}</span>
              <button type="button" onClick={togglePause} style={s.toggleBtn}>
                {profile.status === 'Active' ? 'Pause' : 'Resume'}
              </button>
            </div>
          )}

          <Field label="From (pickup area)">
            <input style={s.input} value={profile.fromLocation} onChange={e => update('fromLocation', e.target.value)} placeholder="e.g. Kondapur" required />
          </Field>

          <Field label="To (office / corridor)">
            <input style={s.input} value={profile.toLocation} onChange={e => update('toLocation', e.target.value)} placeholder="e.g. Hitech City" required />
          </Field>

          <Field label="Departure time">
            <input style={s.input} type="time" value={profile.departureTime} onChange={e => update('departureTime', e.target.value)} required />
          </Field>

          <Field label="Return time (optional)">
            <input style={s.input} type="time" value={profile.returnTime ?? ''} onChange={e => update('returnTime', e.target.value)} />
          </Field>

          <Field label="Role">
            <select style={s.input} value={profile.role} onChange={e => update('role', e.target.value as any)}>
              <option value="Rider">Rider (I need a ride)</option>
              <option value="Owner">Owner (I offer my bike)</option>
              <option value="Both">Both</option>
            </select>
          </Field>

          <Field label="Days of week">
            <div style={s.daysRow}>
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  style={{ ...s.dayBtn, ...(profile.daysOfWeek.includes(d) ? s.dayBtnActive : {}) }}>
                  {d}
                </button>
              ))}
            </div>
          </Field>

          {error && <p style={{ color: '#c00', fontSize: 13 }}>⚠️ {error}</p>}
          {success && <p style={{ color: '#437a22', fontSize: 13 }}>✓ Commute profile saved!</p>}

          <button type="submit" disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : profile.profileId ? 'Update Profile' : 'Create Profile'}
          </button>
        </form>
      )}
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  statusRow:    { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 12, padding: '12px 16px', border: '1px solid #f0f0f0' },
  statusDot:    { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  toggleBtn:    { marginLeft: 'auto', padding: '6px 14px', background: 'none', border: '1.5px solid #ddd', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', color: '#555' },
  input:        { width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0', borderRadius: 10, fontSize: 15, outline: 'none', background: '#fff', boxSizing: 'border-box' },
  daysRow:      { display: 'flex', gap: 8, flexWrap: 'wrap' },
  dayBtn:       { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#555' },
  dayBtnActive: { background: '#01696f', color: '#fff', borderColor: '#01696f' },
  saveBtn:      { padding: '14px', background: '#01696f', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
};
