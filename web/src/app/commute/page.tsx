'use client';
import { useEffect, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

interface CommuteProfileDto {
  id: string;
  homeArea: string;
  homeLat: number;
  homeLng: number;
  officeArea: string;
  officeLat: number;
  officeLng: number;
  morningDepartureTime: string;
  eveningDepartureTime: string;
  activeDays: string[];
  paused: boolean;
}

const DAYS = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
const DAY_LABELS: Record<string,string> = { MON:'Mon',TUE:'Tue',WED:'Wed',THU:'Thu',FRI:'Fri',SAT:'Sat',SUN:'Sun' };

interface FormState {
  homeArea: string;
  homeLat: string;
  homeLng: string;
  officeArea: string;
  officeLat: string;
  officeLng: string;
  morningDepartureTime: string;
  eveningDepartureTime: string;
  activeDays: string[];
}

const emptyForm = (): FormState => ({
  homeArea: '',
  homeLat: '',
  homeLng: '',
  officeArea: '',
  officeLat: '',
  officeLng: '',
  morningDepartureTime: '09:00',
  eveningDepartureTime: '18:00',
  activeDays: ['MON','TUE','WED','THU','FRI'],
});

export default function CommutePage() {
  const [profile, setProfile] = useState<CommuteProfileDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch<CommuteProfileDto>('/api/commute/profile')
      .then(prof => {
        if (prof) {
          setProfile(prof);
          setForm({
            homeArea: prof.homeArea,
            homeLat: String(prof.homeLat),
            homeLng: String(prof.homeLng),
            officeArea: prof.officeArea,
            officeLat: String(prof.officeLat),
            officeLng: String(prof.officeLng),
            morningDepartureTime: prof.morningDepartureTime,
            eveningDepartureTime: prof.eveningDepartureTime,
            activeDays: prof.activeDays,
          });
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        homeArea: form.homeArea,
        homeLat: parseFloat(form.homeLat) || 0,
        homeLng: parseFloat(form.homeLng) || 0,
        officeArea: form.officeArea,
        officeLat: parseFloat(form.officeLat) || 0,
        officeLng: parseFloat(form.officeLng) || 0,
        morningDepartureTime: form.morningDepartureTime + ':00',
        eveningDepartureTime: form.eveningDepartureTime + ':00',
        activeDays: form.activeDays,
      };
      await apiFetch('/api/commute/profile', { method: 'PUT', body: JSON.stringify(payload) });
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
    const endpoint = profile.paused ? '/api/commute/profile/resume' : '/api/commute/profile/pause';
    try {
      await apiFetch(endpoint, { method: 'POST' });
      setProfile(p => p ? { ...p, paused: !p.paused } : p);
    } catch (err: any) {
      setError(err.message);
    }
  }

  function upd<K extends keyof FormState>(key: K, val: FormState[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function toggleDay(d: string) {
    setForm(f => ({
      ...f,
      activeDays: f.activeDays.includes(d) ? f.activeDays.filter(x => x !== d) : [...f.activeDays, d],
    }));
  }

  return (
    <AppShell title="Commute Profile">
      {loading && <div style={{ padding: '40px 0', textAlign: 'center', color: '#999' }}>Loading…</div>}
      {!loading && (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {profile && (
            <div style={s.statusRow}>
              <span style={{ ...s.statusDot, background: profile.paused ? '#964219' : '#437a22' }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: profile.paused ? '#964219' : '#437a22' }}>
                {profile.paused ? 'Paused' : 'Active'}
              </span>
              <button type="button" onClick={togglePause} style={s.toggleBtn}>
                {profile.paused ? 'Resume' : 'Pause'}
              </button>
            </div>
          )}

          {/* Starting point */}
          <div style={s.sectionHeader}>🏠 Starting Point (Home)</div>

          <Field label="Home / Pickup area">
            <input style={s.input} value={form.homeArea} onChange={e => upd('homeArea', e.target.value)} placeholder="e.g. Anjaiah Nagar" required />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Home Lat">
              <input style={s.input} type="number" step="any" value={form.homeLat} onChange={e => upd('homeLat', e.target.value)} placeholder="17.3850" />
            </Field>
            <Field label="Home Lng">
              <input style={s.input} type="number" step="any" value={form.homeLng} onChange={e => upd('homeLng', e.target.value)} placeholder="78.4867" />
            </Field>
          </div>

          {/* Ending point */}
          <div style={s.sectionHeader}>🏢 Ending Point (Office / Destination)</div>

          <Field label="Office / Destination area">
            <input style={s.input} value={form.officeArea} onChange={e => upd('officeArea', e.target.value)} placeholder="e.g. Inorbit Mall" required />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Office Lat">
              <input style={s.input} type="number" step="any" value={form.officeLat} onChange={e => upd('officeLat', e.target.value)} placeholder="17.4340" />
            </Field>
            <Field label="Office Lng">
              <input style={s.input} type="number" step="any" value={form.officeLng} onChange={e => upd('officeLng', e.target.value)} placeholder="78.3800" />
            </Field>
          </div>

          {/* Schedule */}
          <div style={s.sectionHeader}>🕐 Schedule</div>

          <Field label="Morning departure">
            <input style={s.input} type="time" value={form.morningDepartureTime} onChange={e => upd('morningDepartureTime', e.target.value)} required />
          </Field>

          <Field label="Evening departure (return)">
            <input style={s.input} type="time" value={form.eveningDepartureTime} onChange={e => upd('eveningDepartureTime', e.target.value)} />
          </Field>

          <Field label="Days of week">
            <div style={s.daysRow}>
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  style={{ ...s.dayBtn, ...(form.activeDays.includes(d) ? s.dayBtnActive : {}) }}>
                  {DAY_LABELS[d]}
                </button>
              ))}
            </div>
          </Field>

          {error && <p style={{ color: '#c00', fontSize: 13 }}>⚠️ {error}</p>}
          {success && <p style={{ color: '#437a22', fontSize: 13 }}>✓ Commute profile saved!</p>}

          <button type="submit" disabled={saving} style={{ ...s.saveBtn, opacity: saving ? 0.6 : 1 }}>
            {saving ? 'Saving…' : profile ? 'Update Profile' : 'Create Profile'}
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
  sectionHeader:{ fontSize: 13, fontWeight: 700, color: '#01696f', letterSpacing: '0.02em', paddingTop: 4 },
};
