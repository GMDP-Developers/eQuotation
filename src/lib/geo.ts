export type Coords = { latitude: number; longitude: number };
export type ParsedLocation = { coords: Coords; mapsUrl: string | null };

const PURE = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

function valid(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function fromLatLng(latitude: number, longitude: number): Coords | null {
  return valid(latitude, longitude) ? { latitude, longitude } : null;
}

/** Parse input user: link Google Maps ATAU "lat,lng". Null = tidak terbaca. */
export function parseLocation(input: string): ParsedLocation | null {
  const raw = input.trim();
  if (!raw) return null;

  const pure = raw.match(PURE);
  if (pure) {
    const coords = fromLatLng(Number(pure[1]), Number(pure[2]));
    return coords ? { coords, mapsUrl: null } : null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname;
  const isGoogle = /(^|\.)google\./.test(host) || host.endsWith("goo.gl");
  if (!isGoogle) return null;

  const whole = url.toString();
  const at = whole.match(/@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  const q = whole.match(/[?&](?:q|ll)=(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)/);
  const m = at ?? q;
  if (!m) return null; // link pendek / tanpa koordinat

  const coords = fromLatLng(Number(m[1]), Number(m[2]));
  return coords ? { coords, mapsUrl: raw } : null;
}
