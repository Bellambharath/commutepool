'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getMyRoutes, createOffer, type CommuteRoute } from '@/lib/api';
import { getWeekStartMonday } from '@commutepool/shared';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function formatRoute(r: CommuteRoute): string {
  if (r.route_label) return r.route_label;
  const src = r.source_address.split(',')[0] ?? r.source_address;
  const dst = r.destination_address.split(',')[0] ?? r.destination_address;
  return `${src} → ${dst}`;
}

function formatMonday(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number) as [number, number, number];
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
}

export default function NewOfferPage() {
  const { status, accessToken } = useAuth();
  const router = useRouter();

  // Week options — computed once on mount (server/client stable via IST helper)
  const thisWeek = getWeekStartMonday(new Date());
  const nextWeek = getWeekStartMonday(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

  const [routes, setRoutes] = useState<CommuteRoute[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [weekStartDate, setWeekStartDate] = useState<string>(thisWeek);
  const [daysAvailable, setDaysAvailable] = useState<number[]>([]);
  const [departureStart, setDepartureStart] = useState('07:00');
  const [departureEnd, setDepartureEnd] = useState('08:00');
  const [seats, setSeats] = useState(1);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Auth guard
  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  // Load routes on mount once authed
  useEffect(() => {
    if (status !== 'authed' || !accessToken) return;
    getMyRoutes(accessToken).then((res) => {
      if (!res.success || !res.data) {
        setLoadError(res.error ?? 'Failed to load your routes.');
        setRoutes([]);
        return;
      }
      setRoutes(res.data.routes);
      if (res.data.routes.length > 0) {
        setSelectedRouteId(res.data.routes[0]!.id);
      }
    });
  }, [status, accessToken]);

  if (status === 'loading' || routes === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  // Derive period from selected route
  const selectedRoute = routes.find((r) => r.id === selectedRouteId) ?? null;
  const period = selectedRoute?.period ?? 'MORNING';

  // Client-side validation helpers
  const noDay = daysAvailable.length === 0;
  const endBeforeStart = departureEnd <= departureStart;
  const canSubmit = !!selectedRoute && !noDay && !endBeforeStart;

  function toggleDay(d: number) {
    setDaysAvailable((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !accessToken || !selectedRoute) return;
    setSaving(true);
    setSaveError(null);

    const res = await createOffer(
      {
        routeId: selectedRoute.id,
        period,
        weekStartDate,
        daysAvailable,
        departureWindowStart: departureStart,
        departureWindowEnd: departureEnd,
        seatsAvailable: seats,
      },
      accessToken,
    );
    setSaving(false);

    if (res.success) {
      setSaved(true);
      return;
    }

    // Map documented error cases to friendly messages
    if (res.status === 403) {
      setSaveError('You need to be registered as an owner to post offers.');
    } else if (res.status === 409) {
      setSaveError('You already have an offer posted for this route, period, and week.');
    } else if (res.status === 404) {
      setSaveError('Route not found — it may have been deleted. Please refresh and try again.');
    } else {
      setSaveError(res.error ?? 'Failed to post offer. Please try again.');
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
          <h1 className="text-xl font-bold text-gray-900">Offer posted!</h1>
          <p className="mt-2 text-sm text-gray-500">Riders nearby can now find and book your commute.</p>
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

  // No routes saved yet
  if (routes.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900">No routes saved yet</h1>
          <p className="mt-2 text-sm text-gray-500">
            {loadError
              ? loadError
              : 'You need to save a route before posting an offer.'}
          </p>
          <Link
            href="/routes/new"
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                       text-base font-semibold text-white transition-colors
                       hover:bg-brand-dark active:bg-brand-darker"
          >
            Save a route first
          </Link>
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
          <span className="font-semibold text-gray-900">Post a ride offer</span>
        </div>
      </header>

      <form onSubmit={handleSubmit} noValidate className="mx-auto w-full max-w-sm flex-1 space-y-6 px-4 py-6">

        {/* Route picker */}
        <div>
          <label htmlFor="route" className="mb-2 block text-sm font-medium text-gray-700">
            Route
          </label>
          <div className="space-y-2">
            {routes.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRouteId(r.id)}
                className={`w-full rounded-2xl p-4 text-left ring-2 transition-colors
                  ${selectedRouteId === r.id
                    ? 'bg-brand/5 ring-brand'
                    : 'bg-white ring-gray-200 hover:bg-gray-50'
                  }`}
              >
                <p className="truncate text-sm font-semibold text-gray-900">{formatRoute(r)}</p>
                <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium
                  ${r.period === 'MORNING'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-indigo-100 text-indigo-800'
                  }`}>
                  {r.period === 'MORNING' ? 'Morning' : 'Evening'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Week selector */}
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
                  Mon, {formatMonday(value)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Days available */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Days available</p>
          <div className="flex gap-1.5">
            {DAYS.map((name, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-semibold transition-colors
                  ${daysAvailable.includes(i)
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

        {/* Departure window */}
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

        {/* Seats */}
        <div>
          <p className="mb-2 text-sm font-medium text-gray-700">Seats available</p>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeats(n)}
                className={`flex h-11 flex-1 items-center justify-center rounded-xl border text-sm font-semibold transition-colors
                  ${seats === n
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {n}
              </button>
            ))}
          </div>
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
            : 'Post offer'}
        </button>
      </form>
    </main>
  );
}
