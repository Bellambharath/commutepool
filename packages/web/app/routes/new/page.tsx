'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import PlaceSearch from '@/components/PlaceSearch';
import {
  getGoogleRoutes,
  createRoute,
  type PlaceResult,
  type RouteOption,
} from '@/lib/api';

type Period = 'MORNING' | 'EVENING';

function formatDistance(meters: number): string {
  return (meters / 1000).toFixed(1) + ' km';
}

function formatDuration(seconds: number): string {
  return Math.round(seconds / 60) + ' min';
}

export default function NewRoutePage() {
  const { status, accessToken } = useAuth();
  const router = useRouter();

  const [period, setPeriod] = useState<Period>('MORNING');
  const [source, setSource] = useState<PlaceResult | null>(null);
  const [destination, setDestination] = useState<PlaceResult | null>(null);
  const [routeOptions, setRouteOptions] = useState<RouteOption[] | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteOption | null>(null);
  const [fetchingRoutes, setFetchingRoutes] = useState(false);
  const [fetchRoutesError, setFetchRoutesError] = useState<string | null>(null);
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

  const canFindRoutes = !!source && !!destination && !!accessToken;

  async function handleFindRoutes() {
    if (!source || !destination || !accessToken) return;
    setFetchingRoutes(true);
    setFetchRoutesError(null);
    setRouteOptions(null);
    setSelectedRoute(null);
    const res = await getGoogleRoutes(source.placeId, destination.placeId, accessToken);
    setFetchingRoutes(false);
    if (!res.success || !res.data) {
      setFetchRoutesError(res.error ?? 'Failed to fetch routes. Please try again.');
      return;
    }
    setRouteOptions(res.data.routes);
  }

  async function handleSave() {
    if (!source || !destination || !selectedRoute || !accessToken) return;
    setSaving(true);
    setSaveError(null);
    const res = await createRoute(
      {
        period,
        sourcePlaceId: source.placeId,
        sourceLat: source.lat,
        sourceLng: source.lng,
        sourceAddress: source.formattedAddress,
        destinationPlaceId: destination.placeId,
        destinationLat: destination.lat,
        destinationLng: destination.lng,
        destinationAddress: destination.formattedAddress,
        encodedPolyline: selectedRoute.encodedPolyline,
        distanceMeters: selectedRoute.distanceMeters,
        durationSeconds: selectedRoute.durationSeconds,
        routeLabel: selectedRoute.routeLabel,
        isPrimary: true,
      },
      accessToken,
    );
    setSaving(false);
    if (!res.success) {
      setSaveError(res.error ?? 'Failed to save route. Please try again.');
      return;
    }
    setSaved(true);
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
          <h1 className="text-xl font-bold text-gray-900">Route saved!</h1>
          <p className="mt-2 text-sm text-gray-500">Your commute route has been added.</p>
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
          <span className="font-semibold text-gray-900">New route</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm flex-1 space-y-6 px-4 py-6">

        {/* Period selector */}
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

        {/* Place pickers */}
        <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
          <PlaceSearch
            label="Pickup location"
            placeholder="Search for your pickup…"
            accessToken={accessToken ?? ''}
            onSelect={(place) => {
              setSource(place);
              setRouteOptions(null);
              setSelectedRoute(null);
              setFetchRoutesError(null);
            }}
          />
          <PlaceSearch
            label="Drop-off location"
            placeholder="Search for your drop-off…"
            accessToken={accessToken ?? ''}
            onSelect={(place) => {
              setDestination(place);
              setRouteOptions(null);
              setSelectedRoute(null);
              setFetchRoutesError(null);
            }}
          />
        </div>

        {/* Find routes */}
        <button
          type="button"
          onClick={handleFindRoutes}
          disabled={!canFindRoutes || fetchingRoutes}
          className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                     text-base font-semibold text-white transition-colors
                     hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50"
        >
          {fetchingRoutes
            ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            : 'Find routes'}
        </button>

        {fetchRoutesError && (
          <p role="alert" className="text-sm text-red-600">{fetchRoutesError}</p>
        )}

        {/* Route option cards */}
        {routeOptions !== null && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">
              {routeOptions.length === 0 ? 'No routes found.' : 'Select a route'}
            </p>
            {routeOptions.map((route, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setSelectedRoute(route); setSaveError(null); }}
                className={`w-full rounded-2xl p-4 text-left ring-2 transition-colors
                  ${selectedRoute === route
                    ? 'bg-brand/5 ring-brand'
                    : 'bg-white ring-gray-200 hover:bg-gray-50'
                  }`}
              >
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {formatDistance(route.distanceMeters)}
                  </span>
                  <span className="text-gray-400">&middot;</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatDuration(route.durationSeconds)}
                  </span>
                </div>
                <p className="mt-1 truncate text-xs text-gray-500">{route.routeLabel}</p>
              </button>
            ))}
          </div>
        )}

        {/* Save */}
        {routeOptions !== null && routeOptions.length > 0 && (
          <>
            {saveError && (
              <p role="alert" className="text-sm text-red-600">{saveError}</p>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={!selectedRoute || saving}
              className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                         text-base font-semibold text-white transition-colors
                         hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50"
            >
              {saving
                ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                : 'Save this route'}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
