'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { getTrips, type Trip, type TripStatus } from '@/lib/api';

function formatScheduledDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Kolkata',
  });
}

const STATUS_STYLES: Record<TripStatus, string> = {
  SCHEDULED: 'bg-gray-100 text-gray-600',
  ARRIVING: 'bg-blue-100 text-blue-700',
  STARTED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-600',
};

export default function TripsPage() {
  const { status, user, accessToken } = useAuth();
  const router = useRouter();

  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  // Load trips on mount once authed
  useEffect(() => {
    if (status !== 'authed' || !accessToken) return;
    getTrips(accessToken).then((res) => {
      if (!res.success || !res.data) {
        setLoadError(res.error ?? 'Failed to load your trips.');
        setTrips([]);
        return;
      }
      setTrips(res.data.trips);
    });
  }, [status, accessToken]);

  useEffect(() => {
    if (status !== 'authed' || !accessToken) return;
    const id = setInterval(() => {
      getTrips(accessToken).then((res) => {
        if (res.success && res.data) {
          setTrips(res.data.trips);
        }
      });
    }, 30_000);
    return () => clearInterval(id);
  }, [status, accessToken]);

  if (status === 'loading' || trips === null || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900">No trips yet</h1>
          <p className="mt-2 text-sm text-gray-500">
            {loadError ?? 'Your confirmed bookings will appear here.'}
          </p>
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
          <span className="font-semibold text-gray-900">Your trips</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm flex-1 space-y-4 px-4 py-6">
        {trips.map((t) => {
          const isOwner = t.owner_id === user.id;

          return (
            <div key={t.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {formatScheduledDate(t.scheduled_date)}
                </p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status]}`}>
                  {t.status}
                </span>
              </div>

              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium
                ${t.period === 'MORNING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
                }`}>
                {t.period === 'MORNING' ? 'Morning' : 'Evening'}
              </span>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Departure</span>
                <span className="text-sm font-semibold text-gray-900">{t.scheduled_departure}</span>
              </div>

              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500">Contribution</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{(t.booking.contribution_per_day_paise / 100).toFixed(0)}
                </span>
              </div>

              <p className="mt-3 text-xs text-gray-400">
                {isOwner ? "You're the owner" : "You're the rider"}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
