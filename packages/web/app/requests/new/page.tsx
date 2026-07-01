'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PlaceSearch from '@/components/PlaceSearch';
import { createRequest, type PlaceResult } from '@/lib/api';
import { getWeekStartMonday } from '@commutepool/shared';

type Period = 'MORNING' | 'EVENING';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatMonday(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function NewRequestPage() {
  const { status, accessToken } = useAuth();
  const router = useRouter();

  const thisWeek = getWeekStartMonday(new Date());
  const nextWeek = getWeekStartMonday(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [period, setPeriod] = useState<Period>('MORNING');
  const [weekStartDate, setWeekStartDate] = useState<string>(thisWeek);
  const [daysNeeded, setDaysNeeded] = useState<number[]>([]);
  const [pickup, setPickup] = useState<PlaceResult | null>(null);
  const [dropoff, setDropoff] = useState<PlaceResult | null>(null);
  const [departureStart, setDepartureStart] = useState('07:00');
  const [departureEnd, setDepartureEnd] = useState('08:00');

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  const noDay = daysNeeded.length === 0;
  const endBeforeStart = departureEnd <= departureStart;
  const canSubmit = !!pickup && !!dropoff && !noDay && !endBeforeStart && !!accessToken;

  function toggleDay(d: number) {
    setDaysNeeded((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !accessToken || !pickup || !dropoff) return;
    setSaving(true);
    setSaveError(null);

    const res = await createRequest(
      {
        period,
        weekStartDate,
        daysNeeded,
        pickupLat: pickup.lat,
        pickupLng: pickup.lng,
        pickupAddress: pickup.formattedAddress,
        pickupPlaceId: pickup.placeId,
        dropoffLat: dropoff.lat,
        dropoffLng: dropoff.lng,
        dropoffAddress: dropoff.formattedAddress,
        dropoffPlaceId: dropoff.placeId,
        departureWindowStart: departureStart,
        departureWindowEnd: departureEnd,
      },
      accessToken,
    );
    setSaving(false);

    if (res.success) {
      setSaved(true);
      return;
    }

    if (res.status === 403) {
      setSaveError('You need to be registered as a rider to post requests.');
    } else if (res.status === 422) {
      setSaveError(res.error ?? 'Invalid request data. Please check your inputs.');
    } else {
      setSaveError(res.error ?? 'Failed to post request. Please try again.');
    }
  }

  if (saved) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="h-8 w-8" aria-hidden="true">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Request posted!</h1>
          <p className="mt-2 text-sm text-gray-500">We&apos;ll match you with a nearby owner.</p>
          <button
            type="button"
            onClick={() => router.replace('/home')}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                       text-base font-semibold text-white transition-colors
                       hover:bg-brand-dark active:bg-brand-darker"
          >
            Go to home
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-sm items-center gap-3">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-brand hover:text-brand-dark">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden="true">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <span className="font-semibold text-gray-900">Request a ride</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-sm flex-1 space-y-6 px-4 py-6">

        {/* a) Period */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Commute period</p>
          <div className="flex gap-3">
            {(['MORNING', 'EVENING'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPeriod(p)}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors
                  ${period === p
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {p === 'MORNING' ? 'Morning' : 'Evening'}
              </button>
            ))}
          </div>
        </div>

        {/* b) Week */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Week</p>
          <div className="flex gap-3">
            {[
              { label: 'This week', value: thisWeek },
              { label: 'Next week', value: nextWeek },
            ].map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => setWeekStartDate(value)}
                className={`flex-1 rounded-xl border px-3 py-3 text-left text-sm transition-colors
                  ${weekStartDate === value
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="font-semibold">{label}</span>
                <span className={`block text-xs ${weekStartDate === value ? 'text-brand-light' : 'text-gray-400'}`}>
                  {formatMonday(value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* c) Days needed */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Days needed</p>
          <div className="flex gap-1.5">
            {DAYS.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-colors
                  ${daysNeeded.includes(i)
                    ? 'bg-brand text-white'
                    : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                  }`}
              >
                {name}
              </button>
            ))}
          </div>
          {noDay && (
            <p role="alert" className="mt-1.5 text-xs text-red-600">Select at least one day.</p>
          )}
        </div>

        {/* d) Pickup + e) Drop-off */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <PlaceSearch
            label="Pickup location"
            placeholder="Search for your pickup…"
            accessToken={accessToken ?? ''}
            onSelect={(place) => setPickup(place)}
          />
          <PlaceSearch
            label="Drop-off location"
            placeholder="Search for your drop-off…"
            accessToken={accessToken ?? ''}
            onSelect={(place) => setDropoff(place)}
          />
        </div>

        {/* f) Departure window */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <p className="text-sm font-medium text-gray-700">Departure window</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dep-start" className="mb-1 block text-xs font-medium text-gray-600">
                Earliest
              </label>
              <input
                id="dep-start"
                type="time"
                value={departureStart}
                onChange={(e) => setDepartureStart(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm
                           focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
            <div>
              <label htmlFor="dep-end" className="mb-1 block text-xs font-medium text-gray-600">
                Latest
              </label>
              <input
                id="dep-end"
                type="time"
                value={departureEnd}
                onChange={(e) => setDepartureEnd(e.target.value)}
                className="block w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm
                           focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
          {endBeforeStart && (
            <p role="alert" className="text-xs text-red-600">Latest departure must be after earliest.</p>
          )}
        </div>

        {saveError && (
          <p role="alert" className="text-sm text-red-600">{saveError}</p>
        )}

        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                     text-base font-semibold text-white transition-colors
                     hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50"
        >
          {saving
            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : 'Post request'}
        </button>
      </form>
    </main>
  );
}
