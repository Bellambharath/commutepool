/**
 * Decodes a Google Maps encoded polyline string into an array of [lng, lat] pairs.
 * lng is first to match WKT LINESTRING coordinate order.
 *
 * Algorithm: https://developers.google.com/maps/documentation/utilities/polylinealgorithm
 */
export function decodePolyline(encoded: string): Array<[lng: number, lat: number]> {
  const coordinates: Array<[number, number]> = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let result = 0;
    let shift = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // Decode longitude
    result = 0;
    shift = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    // Divide by 1e5 to get floating point degrees; push as [lng, lat] for WKT
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

/**
 * Converts a Google Maps encoded polyline to a PostGIS WKT LINESTRING string.
 * e.g. "LINESTRING(78.4867 17.3850, 78.4900 17.3900)"
 *
 * Requires at least 2 points for a valid LINESTRING; throws if fewer.
 */
export function polylineToWkt(encoded: string): string {
  const coords = decodePolyline(encoded);

  if (coords.length < 2) {
    throw new Error(
      `polylineToWkt: encoded polyline decoded to ${coords.length} point(s); LINESTRING requires at least 2.`,
    );
  }

  const coordStr = coords.map(([lngVal, latVal]) => `${lngVal} ${latVal}`).join(', ');
  return `LINESTRING(${coordStr})`;
}
