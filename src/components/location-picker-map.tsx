"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import { isShortMapsLink, parseLocation } from "@/lib/geo";

type LeafletMap = import("leaflet").Map;
type LeafletMarker = import("leaflet").Marker;
type LeafletNS = typeof import("leaflet");

export function LocationPickerMap({
  value,
  onChange,
  className = "h-52 w-full rounded-lg border bg-white",
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);
  const LRef = useRef<LeafletNS | null>(null);
  const onChangeRef = useRef(onChange);
  const lastClickRef = useRef<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const geoReqRef = useRef(0);
  const searchReqRef = useRef(0);
  const shortRef = useRef<string | null>(null);

  // Link pendek (maps.app.goo.gl) tidak memuat koordinat — resolve via API lalu ganti dengan "lat,lng".
  useEffect(() => {
    if (!value || !isShortMapsLink(value) || shortRef.current === value) return;
    shortRef.current = value;
    setHint("Membaca link Google Maps…");
    fetch(`/api/geo/resolve?url=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.latitude != null && d?.longitude != null) {
          onChange(`${d.latitude},${d.longitude}`);
          setHint(null);
        } else {
          setHint(d?.error ?? "Link tidak bisa dibaca");
        }
      })
      .catch(() => setHint("Gagal membaca link"));
  }, [value, onChange]);

  const coords = value ? parseLocation(value)?.coords ?? null : null;
  const coordsRef = useRef(coords);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    coordsRef.current = value ? parseLocation(value)?.coords ?? null : null;
  }, [value]);

  // Reverse geocode (Nominatim/OSM, gratis tanpa key). Aksesibilitas: alamat
  // hanya pelengkap, kegagalan fetch diabaikan (koordinat tetap tersimpan).
  async function lookup(lat: number, lng: number) {
    const id = ++geoReqRef.current;
    setAddress(null);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&accept-language=id`
      );
      const j = (await r.json()) as { display_name?: string };
      if (id === geoReqRef.current && j.display_name) setAddress(j.display_name);
    } catch {
      /* offline / diblokir: biarkan tanpa alamat */
    }
  }

  // Geocoding pencarian (Nominatim/OSM, gratis tanpa key). Enter di input tidak
  // boleh submit form induk → dicegah di onKeyDown.
  async function search() {
    const q = query.trim();
    if (!q) return;
    const id = ++searchReqRef.current;
    setHint("Mencari…");
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=id&q=${encodeURIComponent(q)}`
      );
      const j = (await r.json()) as Array<{
        lat: string;
        lon: string;
        display_name?: string;
      }>;
      if (id !== searchReqRef.current) return;
      const hit = j[0];
      if (!hit) {
        setHint("Lokasi tidak ditemukan");
        return;
      }
      const formatted = `${Number(hit.lat).toFixed(6)},${Number(hit.lon).toFixed(6)}`;
      lastClickRef.current = formatted;
      onChangeRef.current(formatted);
      setAddress(hit.display_name ?? null);
      setHint(null);
      mapRef.current?.setView([Number(hit.lat), Number(hit.lon)], 15, {
        animate: false,
      });
    } catch {
      if (id === searchReqRef.current) setHint("Pencarian gagal");
    }
  }

  function pin(L: LeafletNS, map: LeafletMap) {
    const c = coordsRef.current;
    if (!c) {
      markerRef.current?.remove();
      markerRef.current = null;
      return;
    }
    if (!markerRef.current) {
      const icon = L.divIcon({
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
      });
      markerRef.current = L.marker([c.latitude, c.longitude], { icon }).addTo(map);
    } else {
      markerRef.current.setLatLng([c.latitude, c.longitude]);
    }
  }

  // init map sekali
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current || mapRef.current) return;
      LRef.current = L;
      const map = L.map(ref.current).setView([-6.2, 106.8], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      map.on("click", (e: { latlng: { lat: number; lng: number } }) => {
        const formatted = `${e.latlng.lat.toFixed(6)},${e.latlng.lng.toFixed(6)}`;
        lastClickRef.current = formatted;
        onChangeRef.current(formatted);
        void lookup(e.latlng.lat, e.latlng.lng);
      });
      mapRef.current = map;
      pin(L, map);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  // sinkron dari input teks → marker
  useEffect(() => {
    const L = LRef.current;
    const map = mapRef.current;
    if (!L || !map) return;
    pin(L, map);
    const c = coordsRef.current;
    if (lastClickRef.current === value) {
      lastClickRef.current = null;
      return;
    }
    setAddress(null); // nilai diubah manual → alamat lama tak berlaku
    if (c) map.setView([c.latitude, c.longitude], 15, { animate: false });
  }, [coords?.latitude, coords?.longitude, value]);

  return (
    <div>
      <div className="relative">
        <div ref={ref} className={className} />
        <div className="absolute right-1.5 top-1.5 z-[1000] flex w-[min(100%-12px,18rem)] gap-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter di dalam form induk tidak boleh submit quotation
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="Cari alamat…"
            aria-label="Cari lokasi di peta"
            className="h-8 w-full rounded-md border border-black/15 bg-white/95 px-2 text-[12px] shadow-sm outline-none focus:border-blue-500"
          />
          <button
            type="button"
            onClick={() => void search()}
            aria-label="Cari"
            className="h-8 shrink-0 rounded-md border border-black/15 bg-white/95 px-2 text-[12px] shadow-sm hover:bg-white"
          >
            Cari
          </button>
        </div>
      </div>
      {hint ?? address ? (
        <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{hint ?? address}</p>
      ) : null}
    </div>
  );
}
