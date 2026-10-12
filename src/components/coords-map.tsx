"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Coords } from "@/lib/geo";

export function CoordsMap({
  coords,
  className = "h-48 w-full rounded-lg border bg-white",
}: {
  coords: Coords;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !ref.current) return;
      map = L.map(ref.current).setView([coords.latitude, coords.longitude], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      const icon = L.divIcon({
        className: "",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        html: '<div style="width:14px;height:14px;border-radius:50%;background:#2563eb;border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></div>',
      });
      L.marker([coords.latitude, coords.longitude], { icon }).addTo(map);
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [coords.latitude, coords.longitude]);

  return <div ref={ref} className={className} />;
}
