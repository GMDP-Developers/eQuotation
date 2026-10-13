export type Coords = { latitude: number; longitude: number };
export type ParsedLocation = { coords: Coords; mapsUrl: string | null };

const PURE = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/;

function valid(latitude: number, longitude: number): boolean {
  return latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function fromLatLng(latitude: number, longitude: number): Coords | null {
  return valid(latitude, longitude) ? { latitude, longitude } : null;
}

/** Link pendek Google Maps (maps.app.goo.gl) — tanpa koordinat di URL, wajib di-resolve. */
export function isShortMapsLink(input: string): boolean {
  try {
    return new URL(input.trim()).hostname === "maps.app.goo.gl";
  } catch {
    return false;
  }
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

  const coords = coordsFromMapsUrl(url.toString());
  return coords ? { coords, mapsUrl: raw } : null;
}

const NUM = String.raw`(-?\d{1,3}(?:\.\d+)?)`;

/**
 * Koordinat dari URL Google Maps.
 * Prioritas: pin place (`!3d`/`!4d`) > `q`/`ll`/`center` > path > `@` (pusat viewport).
 * `@` sengaja terakhir: itu titik tengah layar, bukan lokasi — sumber geser.
 */
export function coordsFromMapsUrl(whole: string): Coords | null {
  const pin3 = whole.match(/!3d(-?\d{1,3}(?:\.\d+)?)/);
  const pin4 = whole.match(/!4d(-?\d{1,3}(?:\.\d+)?)/);
  if (pin3 && pin4) return fromLatLng(Number(pin3[1]), Number(pin4[1]));

  // Format lama: !1d = lintang, !2d = bujur
  const oldLat = whole.match(/!1d(-?\d{1,3}(?:\.\d+)?)/);
  const oldLng = whole.match(/!2d(-?\d{1,3}(?:\.\d+)?)/);
  if (oldLat && oldLng) return fromLatLng(Number(oldLat[1]), Number(oldLng[1]));

  try {
    const sp = new URL(whole).searchParams;
    for (const key of ["q", "query", "ll", "center"]) {
      const v = sp.get(key);
      if (!v) continue;
      const m = v.match(new RegExp(`^${NUM},${NUM}$`));
      if (m) {
        const c = fromLatLng(Number(m[1]), Number(m[2]));
        if (c) return c;
      }
    }
  } catch {
    // bukan URL valid — lanjut ke pola path/@
  }

  const m =
    whole.match(new RegExp(`/\\w+/${NUM},${NUM}`)) ??
    whole.match(new RegExp(`@${NUM},${NUM}`));
  return m ? fromLatLng(Number(m[1]), Number(m[2])) : null;
}
