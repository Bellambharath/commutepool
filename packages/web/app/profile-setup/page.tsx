'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { updateProfile } from '@/lib/api';

const PHONE_RE = /^\+91[6-9]\d{9}$/;
type Role = 'RIDER' | 'OWNER' | 'BOTH';

export default function ProfileSetupPage() {
  const { status, accessToken, setUser } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('RIDER');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'anon') router.replace('/login');
  }, [status, router]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';
    if (emergencyPhone.trim() !== '' && !PHONE_RE.test(emergencyPhone.trim()))
      errs.emergencyPhone = 'Enter a valid Indian mobile number (+91XXXXXXXXXX).';
    if (emergencyPhone.trim() !== '' && emergencyName.trim().length < 2)
      errs.emergencyName = 'Emergency contact name must be at least 2 characters.';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validate() || !accessToken) return;

    setLoading(true);
    const body: Parameters<typeof updateProfile>[1] = {
      name: name.trim(),
      role,
      ...(emergencyName.trim() ? { emergencyContactName: emergencyName.trim() } : {}),
      ...(emergencyPhone.trim() ? { emergencyContactPhone: emergencyPhone.trim() } : {}),
    };
    const res = await updateProfile(accessToken, body);
    setLoading(false);

    if (res.success && res.data) {
      setUser(res.data.user);
      router.replace('/home');
    } else {
      setError(res.error ?? 'Failed to save profile. Please try again.');
    }
  }

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand border-t-transparent" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Set up your profile</h1>
          <p className="mt-1 text-sm text-gray-500">Tell us a bit about yourself to get started.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
              Full name <span className="text-red-500">*</span>
            </label>
            <input
              id="name" type="text" autoComplete="name" placeholder="Your full name"
              value={name}
              onChange={(e) => { setFieldErrors((fe) => ({ ...fe, name: '' })); setName(e.target.value); }}
              className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base
                         placeholder-gray-400 focus:border-brand focus:outline-none
                         focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
              disabled={loading}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
              I want to <span className="text-red-500">*</span>
            </label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value as Role)}
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base
                         focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30
                         disabled:opacity-50"
              disabled={loading}>
              <option value="RIDER">Ride as a pillion (Rider)</option>
              <option value="OWNER">Offer my bike (Owner)</option>
              <option value="BOTH">Both ride and offer</option>
            </select>
          </div>

          {/* Emergency contact */}
          <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
            <p className="mb-3 text-sm font-medium text-amber-800">
              Emergency contact{' '}
              <span className="font-normal text-amber-600">(optional but recommended)</span>
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="emergency-name" className="mb-1 block text-sm font-medium text-gray-700">
                  Contact name
                </label>
                <input id="emergency-name" type="text" autoComplete="off" placeholder="e.g. Priya"
                  value={emergencyName}
                  onChange={(e) => { setFieldErrors((fe) => ({ ...fe, emergencyName: '' })); setEmergencyName(e.target.value); }}
                  className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base
                             placeholder-gray-400 focus:border-brand focus:outline-none
                             focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
                  disabled={loading}
                  aria-describedby={fieldErrors.emergencyName ? 'ec-name-error' : undefined}
                />
                {fieldErrors.emergencyName && (
                  <p id="ec-name-error" className="mt-1 text-xs text-red-600">{fieldErrors.emergencyName}</p>
                )}
              </div>
              <div>
                <label htmlFor="emergency-phone" className="mb-1 block text-sm font-medium text-gray-700">
                  Contact phone
                </label>
                <input id="emergency-phone" type="tel" inputMode="numeric" autoComplete="off"
                  placeholder="+91XXXXXXXXXX" value={emergencyPhone}
                  onChange={(e) => { setFieldErrors((fe) => ({ ...fe, emergencyPhone: '' })); setEmergencyPhone(e.target.value); }}
                  className="block w-full rounded-xl border border-gray-300 px-4 py-3 text-base
                             placeholder-gray-400 focus:border-brand focus:outline-none
                             focus:ring-2 focus:ring-brand/30 disabled:opacity-50"
                  disabled={loading}
                  aria-describedby={fieldErrors.emergencyPhone ? 'ec-phone-error' : undefined}
                />
                {fieldErrors.emergencyPhone && (
                  <p id="ec-phone-error" className="mt-1 text-xs text-red-600">{fieldErrors.emergencyPhone}</p>
                )}
              </div>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3
                       text-base font-semibold text-white transition-colors
                       hover:bg-brand-dark active:bg-brand-darker disabled:opacity-50">
            {loading
              ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              : 'Save and continue'}
          </button>
        </form>
      </div>
    </main>
  );
}
