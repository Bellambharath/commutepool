'use client';

import { useState, useEffect, useRef } from 'react';
import { searchPlaces, type PlaceResult } from '@/lib/api';

export type { PlaceResult };

interface Props {
  label: string;
  placeholder?: string;
  onSelect: (place: PlaceResult) => void;
  accessToken: string;
}

export default function PlaceSearch({ label, placeholder, onSelect, accessToken }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Keep a ref so the debounced callback always uses the latest token.
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setError(null);
    setOpen(false);
    setResults([]);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length < 2) return;

    const q = val.trim();
    const token = accessTokenRef.current;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const res = await searchPlaces(q, token);
      setLoading(false);
      if (!res.success) {
        setError(res.error ?? 'Failed to search places.');
        setOpen(true);
        return;
      }
      setResults(res.data?.places ?? []);
      setOpen(true);
    }, 400);
  }

  function handleSelect(place: PlaceResult) {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(place.displayName);
    setOpen(false);
    setResults([]);
    setError(null);
    setLoading(false);
    onSelect(place);
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder ?? 'Type to search…'}
          className="block w-full rounded-xl border border-gray-300 px-4 py-3 pr-10 text-base
                     placeholder-gray-400 focus:border-brand focus:outline-none
                     focus:ring-2 focus:ring-brand/30"
        />
        {loading && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
            <span className="block h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </span>
        )}
      </div>

      {open && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-white shadow-md ring-1 ring-gray-200">
          {error ? (
            <li className="px-4 py-3 text-sm text-red-600" role="alert">{error}</li>
          ) : results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-gray-500">
              No places found for &ldquo;{query.trim()}&rdquo;
            </li>
          ) : (
            results.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => handleSelect(place)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 active:bg-gray-100"
                >
                  <p className="text-sm font-semibold text-gray-900">{place.displayName}</p>
                  <p className="text-xs text-gray-500">{place.formattedAddress}</p>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
