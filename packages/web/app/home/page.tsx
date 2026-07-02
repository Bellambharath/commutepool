'use client';

// NOTE: This is a stub home screen. Real features (offers, requests, matching, bookings) are deferred.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const ROLE_LABEL: Record<string, string> = {
  RIDER: 'Rider',
  OWNER: 'Bike Owner',
  BOTH: 'Rider & Owner',
};

const STATUS_STYLES: Record<string, string> = {
  ACTIVE:    'bg-green-100 text-green-700',
  PENDING:   'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-red-100 text-red-700',
};

export default function HomePage() {
  const { status, user, logout } = useAuth();
  const router = useRouter();

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

  async function handleLogout() {
    await logout();
    router.replace('/login');
  }

  return (
    <main className="flex min-h-screen flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-sm items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
                <circle cx="18.5" cy="17.5" r="2.5" />
                <circle cx="5.5" cy="17.5" r="2.5" />
                <path d="M15 17.5H9m9 0V9l-4-4H5l-3 3v7h2" />
                <path d="M9 17.5V11h6" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">CommutePool</span>
          </div>
          <button onClick={handleLogout}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium
                       text-gray-600 hover:bg-gray-100 active:bg-gray-200">
            Log out
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-sm flex-1 px-4 py-6">
        {user ? (
          <>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Hi, {user.name || 'there'} &#x1F44B;</h1>
              <p className="mt-1 text-sm text-gray-500">Welcome back to CommutePool.</p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-200">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">
                Your account
              </h2>
              <dl className="space-y-3">
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Phone</dt>
                  <dd className="text-sm font-medium text-gray-900">{user.phone}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Role</dt>
                  <dd className="text-sm font-medium text-gray-900">{ROLE_LABEL[user.role] ?? user.role}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-sm text-gray-500">Status</dt>
                  <dd>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      STATUS_STYLES[user.status] ?? 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.status}
                    </span>
                  </dd>
                </div>
                {user.emergency_contact_name && (
                  <div className="flex items-center justify-between">
                    <dt className="text-sm text-gray-500">Emergency contact</dt>
                    <dd className="text-right text-sm font-medium text-gray-900">
                      {user.emergency_contact_name}
                      {user.emergency_contact_phone && (
                        <><br /><span className="text-gray-500">{user.emergency_contact_phone}</span></>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <Link
              href="/matches"
              className="mt-6 flex w-full items-center justify-between rounded-2xl bg-white p-5
                         shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
            >
              <span className="text-sm font-semibold text-gray-900">Your matches</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-gray-400" aria-hidden="true">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>

            <div className="mt-6 rounded-2xl bg-brand-light p-5">
              <p className="text-sm font-medium text-brand-darker">
                &#x1F6A7; More features coming soon — offers, matching, and bookings will appear here.
              </p>
            </div>
          </>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
          </div>
        )}
      </div>
    </main>
  );
}
