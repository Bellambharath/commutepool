'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { getMatches, createBooking, acceptBooking, rejectBooking, type Match } from '@/lib/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

function shortAddress(addr: string): string {
  return addr.split(',')[0] ?? addr;
}

/** Days both the offer and the request cover, in Sun→Sat index order. */
function daysOverlap(m: Match): number[] {
  return m.offer.days_available
    .filter((d) => m.request.days_needed.includes(d))
    .sort((a, b) => a - b);
}

export default function MatchesPage() {
  const { status, user, accessToken } = useAuth();
  const router = useRouter();

  const [matches, setMatches] = useState<Match[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Inline day-confirmation step — at most one card expanded at a time
  const [bookingMatchId, setBookingMatchId] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [actionState, setActionState] = useState<{
    bookingId: string | null;
    submitting: boolean;
    error: { bookingId: string; message: string } | null;
  }>({ bookingId: null, submitting: false, error: null });

  // Auth guard
  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  // Load matches on mount once authed
  useEffect(() => {
    if (status !== 'authed' || !accessToken) return;
    getMatches(accessToken).then((res) => {
      if (!res.success || !res.data) {
        setLoadError(res.error ?? 'Failed to load your matches.');
        setMatches([]);
        return;
      }
      setMatches(res.data.matches);
    });
  }, [status, accessToken]);

  useEffect(() => {
    if (status !== 'authed' || !accessToken) return;
    const id = setInterval(() => {
      getMatches(accessToken).then((res) => {
        if (res.success && res.data) {
          setMatches(res.data.matches);
        }
      });
    }, 30_000);
    return () => clearInterval(id);
  }, [status, accessToken]);

  if (status === 'loading' || matches === null || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  function openBooking(m: Match) {
    setBookingMatchId(m.id);
    setSelectedDays(daysOverlap(m));
    setSubmitError(null);
  }

  function toggleDay(d: number) {
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d],
    );
  }

  async function handleConfirmBooking(m: Match) {
    if (!accessToken || selectedDays.length === 0) return;
    setSubmitting(true);
    setSubmitError(null);

    const res = await createBooking(
      { matchId: m.id, daysConfirmed: selectedDays },
      accessToken,
    );
    setSubmitting(false);

    if (res.success && res.data) {
      // Update the card in place — no full refetch
      const booking = res.data.booking as { id?: string } | null;
      setMatches((prev) =>
        prev === null
          ? prev
          : prev.map((x) =>
              x.id === m.id
                ? { ...x, bookings: [...x.bookings, { id: booking?.id ?? m.id, status: 'PENDING' }] }
                : x,
            ),
      );
      setBookingMatchId(null);
      return;
    }

    if (res.status === 409) {
      setSubmitError('Someone already booked this match.');
    } else {
      setSubmitError(res.error ?? 'Failed to request booking. Please try again.');
    }
  }

  async function handleAccept(m: Match, bookingId: string) {
    if (!accessToken) return;
    setActionState({ bookingId, submitting: true, error: null });

    const res = await acceptBooking(bookingId, accessToken);

    if (res.success) {
      setActionState({ bookingId: null, submitting: false, error: null });
      setMatches((prev) =>
        prev === null
          ? prev
          : prev.map((x) =>
              x.id === m.id
                ? {
                    ...x,
                    bookings: x.bookings.map((b) =>
                      b.id === bookingId ? { ...b, status: 'ACCEPTED' } : b,
                    ),
                  }
                : x,
            ),
      );
      return;
    }

    setActionState({
      bookingId: null,
      submitting: false,
      error: { bookingId, message: res.error ?? 'Failed to accept booking.' },
    });
  }

  async function handleReject(m: Match, bookingId: string) {
    if (!accessToken) return;
    setActionState({ bookingId, submitting: true, error: null });

    const res = await rejectBooking(bookingId, accessToken);

    if (res.success) {
      setActionState({ bookingId: null, submitting: false, error: null });
      setMatches((prev) =>
        prev === null
          ? prev
          : prev.map((x) =>
              x.id === m.id
                ? {
                    ...x,
                    bookings: x.bookings.map((b) =>
                      b.id === bookingId ? { ...b, status: 'DECLINED' } : b,
                    ),
                  }
                : x,
            ),
      );
      return;
    }

    setActionState({
      bookingId: null,
      submitting: false,
      error: { bookingId, message: res.error ?? 'Failed to decline booking.' },
    });
  }

  if (matches.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-xl font-bold text-gray-900">No matches yet</h1>
          <p className="mt-2 text-sm text-gray-500">
            {loadError ?? "Post an offer or request and we'll find you a match."}
          </p>
          <div className="mt-6 space-y-3">
            <Link
              href="/offers/new"
              className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                         text-base font-semibold text-white transition-colors
                         hover:bg-brand-dark active:bg-brand-darker"
            >
              Post an offer
            </Link>
            <Link
              href="/requests/new"
              className="flex w-full items-center justify-center rounded-xl border border-gray-300 bg-white
                         px-4 py-3 text-base font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Post a request
            </Link>
          </div>
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
          <span className="font-semibold text-gray-900">Your matches</span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm flex-1 space-y-4 px-4 py-6">
        {matches.map((m) => {
          const isOwner = m.offer.owner_id === user.id;
          const overlap = daysOverlap(m);
          const hasPending = m.bookings.some((b) => b.status === 'PENDING');
          const hasAccepted = m.bookings.some((b) => b.status === 'ACCEPTED');
          const confirming = bookingMatchId === m.id;

          return (
            <div key={m.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-gray-900">
                  {shortAddress(m.offer.route.source_address)} → {shortAddress(m.offer.route.destination_address)}
                </p>
                <span className="shrink-0 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                  {m.compatibility_score}% match
                </span>
              </div>

              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium
                ${m.offer.period === 'MORNING'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
                }`}>
                {m.offer.period === 'MORNING' ? 'Morning' : 'Evening'}
              </span>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">Contribution</span>
                <span className="text-sm font-semibold text-gray-900">
                  ₹{(m.total_contribution_paise / 100).toFixed(0)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {overlap.map((d) => (
                  <span key={d}
                    className="rounded-lg bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">
                    {DAYS[d]}
                  </span>
                ))}
              </div>

              {(m.pickup_walk_meters > 0 || m.dropoff_walk_meters > 0) && (
                <div className="mt-2 space-y-0.5">
                  {m.pickup_walk_meters > 0 && (
                    <p className="text-xs text-gray-400">{m.pickup_walk_meters}m walk to pickup</p>
                  )}
                  {m.dropoff_walk_meters > 0 && (
                    <p className="text-xs text-gray-400">{m.dropoff_walk_meters}m walk from drop-off</p>
                  )}
                </div>
              )}

              {isOwner ? (
                hasAccepted ? (
                  <p className="mt-3 text-sm font-medium text-green-700">Booked ✓</p>
                ) : hasPending ? (() => {
                  const pendingBooking = m.bookings.find((b) => b.status === 'PENDING');
                  if (!pendingBooking) return null;
                  const isThisAction = actionState.bookingId === pendingBooking.id;
                  return (
                    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                      <p className="text-sm font-medium text-gray-700">Booking request received</p>
                      {actionState.error?.bookingId === pendingBooking.id && (
                        <p role="alert" className="text-sm text-red-600">{actionState.error?.message}</p>
                      )}
                      <div className="flex gap-3">
                        <button
                          type="button"
                          disabled={actionState.submitting}
                          onClick={() => handleReject(m, pendingBooking.id)}
                          className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5
                                     text-sm font-semibold text-gray-700 transition-colors
                                     hover:bg-gray-50 disabled:opacity-50"
                        >
                          {isThisAction && actionState.submitting ? (
                            <span className="flex items-center justify-center">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                            </span>
                          ) : 'Decline'}
                        </button>
                        <button
                          type="button"
                          disabled={actionState.submitting}
                          onClick={() => handleAccept(m, pendingBooking.id)}
                          className="flex flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2.5
                                     text-sm font-semibold text-white transition-colors
                                     hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50"
                        >
                          {isThisAction && actionState.submitting ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : 'Accept'}
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <p className="mt-3 text-sm font-medium text-gray-600">Waiting for rider to book</p>
                )
              ) : hasAccepted ? (
                <p className="mt-3 text-sm font-medium text-green-700">Booked ✓</p>
              ) : hasPending ? (
                <p className="mt-3 text-sm font-medium text-gray-600">
                  Booking requested — awaiting owner
                </p>
              ) : confirming ? (
                <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
                  <p className="text-sm font-medium text-gray-700">Confirm your days</p>
                  <div className="flex flex-wrap gap-1.5">
                    {overlap.map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors
                          ${selectedDays.includes(d)
                            ? 'bg-brand text-white'
                            : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
                          }`}
                      >
                        {DAYS[d]}
                      </button>
                    ))}
                  </div>
                  {selectedDays.length === 0 && (
                    <p role="alert" className="text-xs text-red-600">Select at least one day.</p>
                  )}
                  {submitError && (
                    <p role="alert" className="text-sm text-red-600">{submitError}</p>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setBookingMatchId(null)}
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5
                                 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={selectedDays.length === 0 || submitting}
                      onClick={() => handleConfirmBooking(m)}
                      className="flex flex-1 items-center justify-center rounded-xl bg-brand px-4 py-2.5
                                 text-sm font-semibold text-white transition-colors
                                 hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50"
                    >
                      {submitting
                        ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        : 'Confirm booking'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openBooking(m)}
                  className="mt-3 flex w-full items-center justify-center rounded-xl bg-brand px-4 py-2.5
                             text-sm font-semibold text-white transition-colors
                             hover:bg-brand-dark active:bg-brand-darker"
                >
                  Request booking
                </button>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
