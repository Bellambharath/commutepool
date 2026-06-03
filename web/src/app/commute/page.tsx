'use client';
import { useEffect, useRef, useState } from 'react';
import AppShell from '@/components/AppShell';
import { apiFetch } from '@/lib/auth';

declare global {
  interface Window {
    google: any;
    initGoogleMaps: () => void;
  }
}

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

interface LocationField {
  area: string;
  lat: number | null;
  lng: number | null;
}

interface FormState {
  home: LocationField;
  office: LocationField;
  morningDepartureTime: string;
  eveningDepartureTime: string;
  activeDays: string[];
}

const emptyForm = (): FormState => ({
  home: { area: '', lat: null, lng: null },
  office: { area: '', lat: null, lng: null },
  morningDepartureTime: '09:00',
  eveningDepartureTime: '18:00',
  activeDays: ['MON','TUE','WED','THU','FRI'],
});

// ── Places autocomplete hook ──────────────────────────────────────────────────
function usePlacesAutocomplete(
  inputRef: React.RefObject<HTMLInputElement>,
  onSelect: (area: string, lat: number, lng: number) => void
) {
  useEffect(() => {
    if (!inputRef.current) return;
    function attach() {
      if (!window.google?.maps?.places) return;
      const ac = new window.google.maps.places.Autocomplete(inputRef.current!, {
        componentRestrictions: { country: 'in' },
        fields: ['formatted_address', 'geometry', 'name'],
      });
      ac.addListener('place_changed', () => {
        const place = ac.getPlace();
        if (!place.geometry?.location) return;
        const area = place.name || place.formatted_address || '';
        onSelect(area, place.geometry.location.lat(), place.geometry.location.lng());
      });
    }
    if (window.google?.maps?.places) {
      attach();
    } else {
      window.initGoogleMaps = attach;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export default function CommutePage() {
  const [profile, setProfile] = useState<CommuteProfileDto | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const homeInputRef = useRef<HTMLInputElement>(null);
  const officeInputRef = useRef<HTMLInputElement>(null);

  // Load Google Maps JS once
  useEffect(() => {
    if (document.getElementById('gmap-script')) return;
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '';
    if (!key) return; // gracefully skip if key not set
    const s = document.createElement('script');
    s.id = 'gmap-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&callback=initGoogleMaps`;
    s.async = true;
    document.head.appendChild(s);
  }, []);

  usePlacesAutocomplete(homeInputRef, (area, lat, lng) =>
    setForm(f => ({ ...f, home: { area, lat, lng } }))
  );
  usePlacesAutocomplete(officeInputRef, (area, lat, lng) =>
    setForm(f => ({ ...f, office: { area, lat, lng } }))
  );

  useEffect(() => {
    apiFetch<CommuteProfileDto>('/api/commute/profile')
      .then(prof => {
        if (prof) {
          setProfile(prof);
          setForm({
            home: { area: prof.homeArea, lat: prof.homeLat, lng: prof.homeLng },
            office: { area: prof.officeArea, lat: prof.officeLat, lng: prof.officeLng },
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
    if (!form.home.area) { setError('Please enter your home / pickup area.'); return; }
    if (!form.office.area) { setError('Please enter your office / destination area.'); return; }
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const payload = {
        homeArea: form.home.area,
        homeLat:  form.home.lat  ?? 0,
        homeLng:  form.home.lng  ?? 0,
        officeArea: form.office.area,
        officeLat:  form.office.lat  ?? 0,
        officeLng:  form.office.lng  ?? 0,
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
    } catch (err: any) { setError(err.message); }
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
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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

          {/* ── Starting Point ── */}
          <div style={s.sectionHeader}>🏠 Starting Point</div>

          <Field label="Where do you start from?">
            <input
              ref={homeInputRef}
              style={s.input}
              value={form.home.area}
              onChange={e => setForm(f => ({ ...f, home: { area: e.target.value, lat: null, lng: null } }))}
              placeholder="e.g. Anjaiah Nagar, Hyderabad"
              required
              autoComplete="off"
            />
            {form.home.lat && (
              <p style={s.hint}>✅ Location confirmed</p>
            )}
          </Field>

          {/* ── Ending Point ── */}
          <div style={s.sectionHeader}>🏢 Ending Point (Office / Destination)</div>

          <Field label="Where do you go to?">
            <input
              ref={officeInputRef}
              style={s.input}
              value={form.office.area}
              onChange={e => setForm(f => ({ ...f, office: { area: e.target.value, lat: null, lng: null } }))}
              placeholder="e.g. International Tech Park Hyderabad"
              required
              autoComplete="off"
            />
            {form.office.lat && (
              <p style={s.hint}>✅ Location confirmed</p>
            )}
          </Field>

          {/* ── Schedule ── */}
          <div style={s.sectionHeader}>🕐 Schedule</div>

          <Field label="Morning departure">
            <input style={s.input} type="time" value={form.morningDepartureTime}
              onChange={e => setForm(f => ({ ...f, morningDepartureTime: e.target.value }))} required />
          </Field>

          <Field label="Evening departure (return)">
            <input style={s.input} type="time" value={form.eveningDepartureTime}
              onChange={e => setForm(f => ({ ...f, eveningDepartureTime: e.target.value }))} />
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
  hint:         { margin: '4px 0 0', fontSize: 12, color: '#437a22' },
  daysRow:      { display: 'flex', gap: 8, flexWrap: 'wrap' },
  dayBtn:       { padding: '8px 12px', borderRadius: 8, border: '1.5px solid #ddd', background: '#fff', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#555' },
  dayBtnActive: { background: '#01696f', color: '#fff', borderColor: '#01696f' },
  saveBtn:      { padding: '14px', background: '#01696f', color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: 'pointer' },
  sectionHeader:{ fontSize: 13, fontWeight: 700, color: '#01696f', letterSpacing: '0.02em', paddingTop: 4 },
};
