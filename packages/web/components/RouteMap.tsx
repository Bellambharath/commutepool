'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import type { RouteOption } from '@/lib/api';

interface Props {
  routes: RouteOption[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  sourceLat: number;
  sourceLng: number;
  destinationLat: number;
  destinationLng: number;
}

const SELECTED_STYLE = { strokeColor: '#01696f', strokeWeight: 5, strokeOpacity: 1.0 };
const UNSELECTED_STYLE = { strokeColor: '#9ca3af', strokeWeight: 3, strokeOpacity: 0.6 };

export default function RouteMap({
  routes,
  selectedIndex,
  onSelect,
  sourceLat,
  sourceLng,
  destinationLat,
  destinationLng,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);
  // Ref so the polyline click listener always calls the latest onSelect.
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  const [mapReady, setMapReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load SDK and initialise map once on mount.
  // routes/coords are stable while this component is mounted:
  // the parent unmounts it when routeOptions resets to null (new Find Routes).
  useEffect(() => {
    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      libraries: ['geometry'],
    });

    loader.load().then(() => {
      if (!mapDivRef.current) return;

      const map = new google.maps.Map(mapDivRef.current, {
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
      });
      mapRef.current = map;

      const bounds = new google.maps.LatLngBounds();
      bounds.extend(new google.maps.LatLng(sourceLat, sourceLng));
      bounds.extend(new google.maps.LatLng(destinationLat, destinationLng));
      map.fitBounds(bounds, 40);

      markersRef.current = [
        new google.maps.Marker({ position: { lat: sourceLat, lng: sourceLng }, map, title: 'Pickup' }),
        new google.maps.Marker({ position: { lat: destinationLat, lng: destinationLng }, map, title: 'Drop-off' }),
      ];

      polylinesRef.current = routes.map((route, i) => {
        const path = google.maps.geometry.encoding.decodePath(route.encodedPolyline);
        const style = i === selectedIndex ? SELECTED_STYLE : UNSELECTED_STYLE;
        const polyline = new google.maps.Polyline({ path, map, clickable: true, ...style });
        polyline.addListener('click', () => onSelectRef.current(i));
        return polyline;
      });

      setMapReady(true);
    }).catch(() => {
      setLoadError('Map failed to load — you can still select a route below.');
    });

    return () => {
      polylinesRef.current.forEach((p) => p.setMap(null));
      markersRef.current.forEach((m) => m.setMap(null));
      polylinesRef.current = [];
      markersRef.current = [];
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-style polylines on selection change — no map remount.
  useEffect(() => {
    polylinesRef.current.forEach((polyline, i) => {
      polyline.setOptions(i === selectedIndex ? SELECTED_STYLE : UNSELECTED_STYLE);
    });
  }, [selectedIndex]);

  if (loadError) {
    return (
      <p role="alert" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 ring-1 ring-amber-200">
        {loadError}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-gray-200">
      {!mapReady && (
        <div className="flex h-64 items-center justify-center bg-gray-100">
          <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        </div>
      )}
      <div ref={mapDivRef} className={`h-64 w-full${mapReady ? '' : ' hidden'}`} />
    </div>
  );
}
