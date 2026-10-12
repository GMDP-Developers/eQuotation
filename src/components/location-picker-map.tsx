"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import { parseLocation } from "@/lib/geo";

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

  const coords = value ? parseLocation(value)?.coords ?? null : null;
  const coordsRef = useRef(coords);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    coordsRef.current = value ? parseLocation(value)?.coords ?? null : null;
  }, [value]);

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
    if (c) map.setView([c.latitude, c.longitude], 15, { animate: false });
  }, [coords?.latitude, coords?.longitude, value]);

  return <div ref={ref} className={className} />;
}
