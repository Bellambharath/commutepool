import { config } from '../config/env.js';
import type { PlaceSuggestion } from '@commutepool/shared';

const PLACES_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchText';
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location';

interface PlacesApiPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[];
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const response = await fetch(PLACES_SEARCH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.GOOGLE_MAPS_API_KEY,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({ textQuery: query }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Places API returned ${response.status}: ${text}`);
  }

  const data = (await response.json()) as PlacesApiResponse;

  return (data.places ?? []).map((p): PlaceSuggestion => ({
    placeId: p.id,
    displayName: p.displayName?.text ?? '',
    formattedAddress: p.formattedAddress ?? '',
    lat: p.location?.latitude ?? 0,
    lng: p.location?.longitude ?? 0,
  }));
}
