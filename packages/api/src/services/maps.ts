import { Client, TravelMode, UnitSystem } from '@googlemaps/google-maps-services-js';
import { config } from '../config/env.js';
import type { LatLng, RouteOption } from '@commutepool/shared';

const mapsClient = new Client({});

// Strip HTML tags from a string (html_instructions from Directions API contain markup)
function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, '').trim();
}

/**
 * Calls Google Directions API with alternatives: true.
 * Returns up to 3 routes, each with encoded polyline, distance, duration, and a label.
 */
export async function getRoutes(
  origin: LatLng,
  destination: LatLng,
): Promise<RouteOption[]> {
  const response = await mapsClient.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      alternatives: true,
      mode: TravelMode.driving,
      units: UnitSystem.metric,
      key: config.GOOGLE_MAPS_API_KEY,
    },
  });

  const routes = response.data.routes.slice(0, 3);

  return routes.map((route, index): RouteOption => {
    const leg = route.legs[0];
    const distanceMeters = leg?.distance?.value ?? 0;
    const durationSeconds = leg?.duration?.value ?? 0;
    const encodedPolyline = route.overview_polyline.points;

    // Build a human-readable label from the first step's html_instructions
    let routeLabel = `Route ${index + 1}`;
    const firstStepInstruction = leg?.steps?.[0]?.html_instructions;
    if (firstStepInstruction) {
      const stripped = stripHtml(firstStepInstruction);
      routeLabel = stripped.length > 0 ? stripped : routeLabel;
    } else if (route.summary) {
      routeLabel = `Via ${route.summary}`;
    }

    return {
      encodedPolyline,
      distanceMeters,
      durationSeconds,
      routeLabel,
    };
  });
}

/**
 * Geocodes a Google Place ID to { lat, lng }.
 * Returns null on any failure so callers can handle gracefully.
 */
export async function geocodeAddress(placeId: string): Promise<LatLng | null> {
  try {
    const response = await mapsClient.geocode({
      params: {
        place_id: placeId,
        key: config.GOOGLE_MAPS_API_KEY,
      },
    });

    const location = response.data.results[0]?.geometry?.location;
    if (!location) return null;

    return { lat: location.lat, lng: location.lng };
  } catch {
    return null;
  }
}
