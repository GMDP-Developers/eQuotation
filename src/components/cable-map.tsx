"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

// ASC route (lon, lat), Singapore → Perth; source: submarinecablemap.com cable-geo.json, 2026-10-05
const ROUTE: [number, number][] = [
  [103.946, 1.327], [103.781, 1.019], [103.781, 0.794], [104.175, 0.513],
  [104.85, 0.401], [105.3, 0.119], [105.975, -0.781], [106.764, -2.131],
  [107.016, -3.03], [106.987, -4.601], [106.537, -5.162], [106.312, -5.498],
  [105.75, -5.946], [105.3, -6.169], [105.075, -6.617], [105.142, -7.573],
  [105.975, -10.399], [106.2, -11.944], [107.696, -15.342], [109.8, -20.434],
  [111.972, -27.039], [113.4, -30.31], [113.957, -31.082], [115.857, -31.953],
];

// ASC spurs (lon, lat) — cabang rute ke landing Anyer & Christmas Island; cable-geo.json 2026-10-05.
// Ujung spur memakai koordinat landing yang sama dengan LANDINGS agar tepat di tengah dot.
const ASC_SPURS: [number, number][][] = [
  [[105.75, -5.946], [105.8839, -6.0737]],
  [[105.975, -10.399], [105.8625, -10.3988], [105.6971, -10.4374]],
];

// MCS route (lon, lat), Singapore ↔ Jakarta; source: submarinecablemap.com cable-geo.json, 2026-10-05
// 3 segments (MultiLineString): Jakarta → Selat Sunda → Singapura, plus loop Singapura timur.
const MCS: [number, number][][] = [
  [[106.833, -6.172], [106.875, -5.274], [107.325, -4.601], [107.213, -3.03], [107.098, -2.131], [106.762, -0.331], [105.3, 1.131]],
  [[105.3, 1.131], [104.85, 1.243], [104.625, 1.229], [104.194, 1.295], [103.987, 1.389]],
  [[104.017, 1.067], [104.02, 1.213], [104.166, 1.231], [104.288, 1.188], [104.625, 1.187], [104.85, 1.131], [105.3, 1.131]],
];

// B2JS route (lon, lat), Jakarta → Bangka → Batam → Singapore; source: submarinecablemap.com
// cable-geo.json, 2026-10-05 — satu polyline 18 titik; warna digeser ke oranye (upstream #31b34a)
// agar tidak bentrok dengan MCS.
const B2JS: [number, number][] = [
  [106.828, -6.172], [106.425, -5.274], [106.65, -4.601], [106.762, -3.479], [106.547, -3.08],
  [106.312, -2.581], [105.862, -1.906], [105.583, -1.554], [105.525, -1.231], [105.187, 0.119],
  [104.85, 0.346], [104.175, 0.456], [103.725, 0.794], [103.725, 1.019], [103.878, 1.135],
  [104.017, 1.067], [103.922, 1.185], [103.946, 1.327],
];

// RISING 8 route (lon, lat), Singapore ↔ Tanjung Bemban/Tanjung Pakis; source:
// submarinecablemap.com cable-geo.json, 2026-10-05 — 2 segmen (MultiLineString),
// warna magenta mengikuti upstream #954098.
const R8: [number, number][][] = [
  [[104.133, 1.174], [103.987, 1.375]],
  [[107.121, -5.981], [106.411, -4.603], [106.979, -2.961], [106.516, -1.514], [105.407, 0.176],
  [104.941, 0.723], [104.538, 0.869], [104.133, 1.174]],
];

// Landing station keempat kabel (lon, lat) — submarinecablemap.com landing-point-geo.json 2026-10-05.
// `dx/dy` = offset label (unit user, dx negatif → teks rata kanan); diatur agar tidak bertumpuk.
// `tone` = warna kabel (dot + label), disamakan dengan warna jalurnya.
const LANDINGS: {
  id: string;
  label: string;
  tone: string;
  at: [number, number];
  dx: number;
  dy: number;
  anchor?: "start" | "middle" | "end";
}[] = [
  // ASC (Australia-Singapore Cable)
  { id: "tanah-merah-singapore", label: "SINGAPORE", tone: "fill-primary", at: [103.9466, 1.3273], dx: -7, dy: 3 },
  { id: "anyer-indonesia", label: "ANYER", tone: "fill-primary", at: [105.8839, -6.0737], dx: 7, dy: -9 },
  { id: "flying-fish-cove-christmas-island", label: "CHRISTMAS ISLAND", tone: "fill-primary", at: [105.6971, -10.4374], dx: -7, dy: 3 },
  { id: "perth-wa-australia", label: "PERTH", tone: "fill-primary", at: [115.8572, -31.9534], dx: 7, dy: 3 },
  // MCS (Matrix Cable System)
  { id: "batam-indonesia", label: "BATAM", tone: "fill-cable-2", at: [104.0166, 1.0668], dx: 0, dy: 13, anchor: "middle" },
  { id: "jakarta-indonesia", label: "JAKARTA", tone: "fill-cable-2", at: [106.8279, -6.1716], dx: 0, dy: 15, anchor: "middle" },
  { id: "changi-south-singapore", label: "CHANGI SOUTH", tone: "fill-cable-2", at: [103.987, 1.389], dx: -7, dy: -9.5 },
  // B2JS (Jakarta-Bangka-Batam-Singapore)
  { id: "batu-prahu-indonesia", label: "BATU PRAHU", tone: "fill-cable-3", at: [106.5475, -3.0799], dx: -7, dy: 3 },
  { id: "pesaren-indonesia", label: "PESAREN", tone: "fill-cable-3", at: [105.5827, -1.5539], dx: -7, dy: 3 },
  // RISING 8
  { id: "tanjung-bemban-indonesia", label: "TANJUNG BEMBAN", tone: "fill-cable-4", at: [104.1331, 1.1732], dx: 7, dy: 28 },
  { id: "tanjung-pakis-indonesia", label: "TANJUNG PAKIS", tone: "fill-cable-4", at: [107.1209, -5.9813], dx: 7, dy: 5 },
  { id: "changi-north-singapore", label: "CHANGI NORTH", tone: "fill-cable-4", at: [103.987, 1.389], dx: 7, dy: -1 },
];

// Land outlines (lon, lat): Natural Earth 1:50m, world-atlas@2 countries-50m.json —
// 9 Indonesia rings, 1 Australia, 1 Singapore; Douglas–Peucker 0.14° (IDN/AUS) & 0.003° (SGP);
// rings whose lon/lat extent < 0.7° dropped; neighbours (Malaysia, Timor-Leste) excluded by design.
const LAND: [number, number][][] = [
  [[108.92, 0.91], [109.08, 1.5], [109.63, 2.03], [109.66, 1.62], [110.5, 0.86], [111.81, 1.01], [112.48, 1.56], [113.62, 1.24], [114.54, 1.47], [114.79, 2.25], [115.18, 2.52], [115.12, 2.89], [115.45, 3.04], [115.57, 3.94], [115.9, 4.35], [117.58, 4.17], [117.78, 3.69], [117.06, 3.62], [118.06, 2.32], [117.79, 2.03], [118.64, 1.32], [118.99, 0.98], [118.53, 0.81], [117.91, 1.1], [117.52, 0.24], [117.56, -0.77], [116.91, -1.22], [116.74, -1.04], [116.75, -1.33], [116.28, -1.79], [116.55, -2.41], [116.32, -2.55], [115.96, -3.59], [114.7, -4.17], [114.34, -3.24], [113.71, -3.46], [113.61, -3.2], [113.34, -3.25], [113.04, -2.93], [112.76, -3.32], [111.86, -3.55], [111.7, -2.89], [110.26, -2.97], [109.98, -1.28], [109.26, -0.81], [109.26, 0.03], [108.95, 0.36], [108.92, 0.91]],
  [[95.23, 5.56], [97.55, 5.21], [98.31, 4.09], [99.73, 3.18], [100.53, 2.19], [100.89, 1.95], [100.83, 2.24], [101.05, 2.26], [101.48, 1.69], [102.1, 1.36], [102.39, 0.84], [102.95, 0.66], [103.01, 0.42], [102.55, 0.22], [103.48, 0.48], [103.79, 0.05], [103.43, -0.19], [103.44, -0.58], [103.72, -0.89], [104.36, -1.04], [104.51, -1.82], [104.85, -2.09], [104.7, -2.6], [105.4, -2.38], [106.04, -3.11], [105.84, -3.61], [105.75, -5.82], [105.35, -5.55], [105.08, -5.75], [104.64, -5.52], [104.6, -5.91], [102.54, -4.15], [100.94, -2.34], [100.31, -0.83], [99.67, 0.05], [99.16, 0.35], [98.6, 1.87], [97.7, 2.36], [97.59, 2.85], [96.97, 3.58], [95.58, 4.66], [95.23, 5.56]],
  [[114.6, -8.73], [113.25, -8.29], [111.51, -8.3], [109.28, -7.71], [108.22, -7.78], [106.45, -7.37], [106.52, -7.05], [105.24, -6.78], [105.48, -6.78], [106.07, -5.91], [107.01, -6.01], [108.29, -6.26], [108.78, -6.81], [110.43, -6.95], [110.84, -6.42], [111.18, -6.69], [112.54, -6.93], [113.01, -7.66], [114.41, -7.79], [114.39, -8.41], [114.6, -8.73]],
  [[106.67, -3.07], [106, -2.83], [105.79, -2.18], [105.13, -2.04], [105.39, -1.75], [105.58, -1.53], [105.7, -1.73], [105.72, -1.53], [105.98, -1.54], [106.36, -2.46], [106.82, -2.57], [106.67, -3.07]],
  [[116.72, -8.34], [116.59, -8.89], [115.87, -8.74], [116.08, -8.75], [116.06, -8.44], [116.3, -8.24], [116.72, -8.34]],
  [[114.48, -8.12], [115.55, -8.21], [115.7, -8.41], [115.24, -8.8], [114.48, -8.12]],
  [[108.29, -2.83], [108.06, -3.23], [107.64, -3.12], [107.67, -2.57], [108.29, -2.83]],
  [[114.08, -6.99], [113.13, -7.22], [112.76, -7.14], [112.87, -6.9], [114.08, -6.99]],
  [[116.09, -4.05], [116.06, -3.46], [116.26, -3.39], [116.3, -3.87], [116.09, -4.05]],
  [[115.01, -34.26], [114.99, -33.51], [115.36, -33.64], [115.68, -33.19], [115.7, -31.7], [115.08, -30.56], [114.86, -29.14], [114.17, -28.08], [114.03, -27.35], [113.18, -26.18], [113.36, -26.08], [113.58, -26.56], [113.83, -26.5], [113.45, -25.6], [113.72, -26.13], [113.85, -26.02], [113.99, -26.32], [114.22, -26.29], [114.21, -25.85], [113.42, -24.44], [113.76, -23.42], [113.68, -22.64], [114.02, -21.88], [114.14, -22.48], [114.71, -21.82], [116.71, -20.65], [117.41, -20.72], [119.11, -19.99], [121, -19.6], [122.35, -18.11], [122.14, -17.43], [122.33, -17.06], [122.97, -16.44], [123.56, -17.52], [123.59, -17.03], [123.83, -17.12], [123.88, -16.92], [123.49, -16.49], [123.61, -16.22], [124.77, -16.4], [124.4, -16.3], [124.65, -15.87], [124.51, -15.97], [124.38, -15.76], [124.44, -15.49], [124.69, -15.27], [125.06, -15.44], [124.84, -15.16], [125.04, -15], [125.36, -15.12], [125.18, -14.72], [125.63, -14.26], [125.66, -14.53], [126.02, -14.5], [126.05, -13.98], [126.57, -14.16], [126.9, -13.74], [127.46, -14.03], [128.18, -14.71], [128.07, -15.33], [128.58, -14.77], [129.06, -14.88], [129.21, -15.16], [129.27, -14.87], [129.64, -15.14], [129.64, -14.85], [129.85, -14.83], [129.38, -14.39], [129.84, -13.57], [130.26, -13.3], [130.17, -12.96], [130.62, -12.43], [130.87, -12.56], [131.29, -12.07], [131.44, -12.28], [132.71, -12.12], [132.67, -11.65], [132.07, -11.47], [131.82, -11.3], [131.96, -11.18], [135.03, -12.19], [135.92, -11.83], [135.71, -12.21], [135.94, -12.15], [136.08, -12.42], [136.26, -12.43], [136.44, -11.95], [136.9, -12.24], [136.46, -13.23], [135.93, -13.3], [135.95, -13.93], [135.45, -14.92], [138.25, -16.72], [139.01, -16.9], [139.25, -17.33], [140.04, -17.7], [140.83, -17.41], [141.29, -16.46], [141.63, -15.06], [141.53, -13.55], [141.61, -12.94], [141.92, -12.8], [141.69, -12.35], [141.96, -12.05], [142.17, -10.95], [142.61, -10.75], [142.87, -11.82], [143.18, -11.96], [143.11, -12.3], [143.4, -12.64], [143.75, -14.35], [143.96, -14.46], [144.47, -14.23], [145.29, -14.94], [145.43, -16.41], [145.91, -16.91], [146.13, -17.64], [146.03, -18.27], [146.33, -18.55], [146.38, -18.98], [147.42, -19.38], [147.74, -19.77], [148.76, -20.29], [148.88, -20.48], [148.68, -20.58], [149.21, -21.12], [149.71, -22.44], [149.98, -22.55], [150.08, -22.16], [150.54, -22.56], [150.67, -22.42], [150.84, -23.46], [151.83, -24.12], [153.17, -25.96], [153.12, -27.19], [153.62, -28.67], [152.95, -31.43], [152.47, -32.44], [151.29, -33.58], [150.8, -35.01], [150.2, -35.83], [149.93, -37.53], [149.48, -37.77], [147.88, -37.93], [146.86, -38.66], [146.22, -38.73], [146.47, -38.84], [146.4, -39.15], [145.4, -38.54], [145.48, -38.24], [144.96, -38.5], [144.72, -38.34], [145.12, -38.09], [144.89, -37.9], [143.54, -38.82], [142.46, -38.39], [141.43, -38.36], [140.39, -37.9], [139.78, -37.25], [139.73, -36.37], [138.97, -35.58], [139.29, -35.61], [139.28, -35.38], [138.19, -35.61], [138.51, -35.02], [138.09, -34.17], [137.69, -35.14], [136.88, -35.24], [137.02, -34.92], [137.39, -34.91], [137.49, -34.16], [137.93, -33.58], [137.78, -32.58], [137.24, -33.63], [136.43, -34.03], [135.89, -34.66], [135.97, -34.98], [135.65, -34.94], [135.12, -34.59], [135.45, -34.58], [135.22, -33.96], [134.72, -33.26], [134.3, -33.17], [134.1, -32.75], [134.23, -32.55], [132.76, -31.96], [132.21, -32.01], [131.14, -31.5], [128.95, -31.7], [127.32, -32.26], [125.92, -32.3], [124.24, -33.01], [123.51, -33.92], [119.85, -33.97], [119.45, -34.37], [117.86, -35.05], [116.52, -34.99], [115.01, -34.26]],
  [[103.65, 1.33], [103.7, 1.42], [103.82, 1.45], [103.91, 1.42], [103.96, 1.39], [104, 1.37], [103.97, 1.33], [103.82, 1.27], [103.65, 1.33]],
];

// Equirectangular with cos(mid-lat) correction; OX/OY menaruh rute di tengah bingkai 520 lebar.
const VIEW = 520;
const LON0 = 103.781, LON1 = 115.857, LAT0 = -31.953, LAT1 = 1.327;
const KX = Math.cos((-15.3 * Math.PI) / 180); // ≈0.9646
const K = (VIEW * 0.86) / (LAT1 - LAT0); // ≈13.437 px/deg latitude
const W = (LON1 - LON0) * KX * K; // ≈156 px route width
const OX = (VIEW - W) / 2; // ≈182
const OY = (VIEW - (LAT1 - LAT0) * K) / 2; // ≈36
const px = ([lon, lat]: [number, number]) =>
  `${(OX + (lon - LON0) * KX * K).toFixed(1)},${(OY + (LAT1 - lat) * K).toFixed(1)}`;
const P = LANDINGS.map((l) => ({
  ...l,
  x: OX + (l.at[0] - LON0) * KX * K,
  y: OY + (LAT1 - l.at[1]) * K,
}));

const ROUTE_D = "M" + ROUTE.map(px).join(" L") + " " + ASC_SPURS.map((l) => "M" + l.map(px).join(" L")).join(" ");
const LAND_D = LAND.map((ring) => "M" + ring.map(px).join(" L") + " Z");
const MCS_D = MCS.map((l) => "M" + l.map(px).join(" L")).join(" ");
const B2JS_D = "M" + B2JS.map(px).join(" L");
const R8_D = R8.map((l) => "M" + l.map(px).join(" L")).join(" ");

/**
 * Bingkai 16:10. viewBox awal menampilkan bagian utara (Singapura–Jawa); sisanya
 * (Australia/Perth) dijangkau dengan zoom/geser — batas geser = CONTENT.
 */
type View = { x: number; y: number; k: number };
const FRAME_W = VIEW;
const FRAME_H = (FRAME_W * 8) / 16;
const CONTENT = { x: 0, y: -5, w: 830, h: 605 };
const ZOOM_MIN = 1;
const ZOOM_MAX = 8;
const ZOOM_STEP = 1.6;
const BTN =
  "flex size-7 items-center justify-center rounded-md border border-border bg-card/90 text-foreground shadow-sm backdrop-blur transition hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:opacity-40";

/** Ukuran viewBox pada faktor zoom k. */
const frameAt = (k: number) => ({ w: FRAME_W / k, h: FRAME_H / k });

/** Tahan view di dalam CONTENT. */
const clampView = (v: View): View => {
  const { w, h } = frameAt(v.k);
  return {
    k: v.k,
    x: Math.min(Math.max(v.x, CONTENT.x), CONTENT.x + CONTENT.w - w),
    y: Math.min(Math.max(v.y, CONTENT.y), CONTENT.y + CONTENT.h - h),
  };
};

/** Zoom ke faktor baru sambil menahan titik (cx, cy) tetap, lalu clamp. */
const zoomView = (v: View, factor: number, cx: number, cy: number): View => {
  const k = Math.min(Math.max(v.k * factor, ZOOM_MIN), ZOOM_MAX);
  const a = frameAt(v.k);
  const b = frameAt(k);
  return clampView({
    k,
    x: cx - ((cx - v.x) / a.w) * b.w,
    y: cy - ((cy - v.y) / a.h) * b.h,
  });
};

/** Angka viewBox/atribut tanpa desimal bila bulat. */
const num = (v: number) => Number(v.toFixed(3));

export function CableMap() {
  const [view, setView] = useState<View>({ x: 0, y: 0, k: ZOOM_MIN });
  const svgRef = useRef<SVGSVGElement>(null);
  const dragging = useRef<{ px: number; py: number } | null>(null);
  const z = view.k;
  const frame = frameAt(view.k);
  const zoomed = view.k > ZOOM_MIN;

  // Wheel zoom: listener native non-passive → preventDefault boleh (halaman tidak ikut scroll).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      setView((v) => {
        const a = frameAt(v.k);
        const cx = v.x + ((e.clientX - rect.left) / rect.width) * a.w;
        const cy = v.y + ((e.clientY - rect.top) / rect.height) * a.h;
        return zoomView(v, Math.exp(-e.deltaY * 0.0015), cx, cy);
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomFromCenter = (factor: number) =>
    setView((v) => {
      const a = frameAt(v.k);
      return zoomView(v, factor, v.x + a.w / 2, v.y + a.h / 2);
    });

  // Geser (pan) — mouse; sentuhan dibiarkan ke scroll halaman. Batas geser = CONTENT.
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    dragging.current = { px: e.clientX, py: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = dragging.current;
    if (!d) return;
    const scale = frame.w / e.currentTarget.getBoundingClientRect().width;
    const dx = (e.clientX - d.px) * scale;
    const dy = (e.clientY - d.py) * scale;
    dragging.current = { px: e.clientX, py: e.clientY };
    setView((v) => clampView({ ...v, x: v.x - dx, y: v.y - dy }));
  };
  const endDrag = () => {
    dragging.current = null;
  };

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
      <div className="relative aspect-[16/8] bg-muted">
        <svg
          ref={svgRef}
          className={`absolute h-full w-full ${zoomed ? "cursor-grab active:cursor-grabbing" : ""}`}
          viewBox={`${num(view.x)} ${num(view.y)} ${num(frame.w)} ${num(frame.h)}`}
          fill="none"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
        >
          {/* Graticule */}
          <g className="stroke-border" strokeOpacity={0.7} strokeWidth={num(0.75 / z)}>
            {[105, 110, 115].map((lon) => {
              const a = px([lon, LAT0]).split(",");
              const b = px([lon, LAT1]).split(",");
              return <line key={lon} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
            })}
            {[0, -10, -20, -30].map((lat) => {
              const a = px([LON0, lat]).split(",");
              const b = px([LON1, lat]).split(",");
              return <line key={lat} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
            })}
          </g>

          {/* Daratan: Indonesia, Singapura, Australia — di atas graticule, terang di atas laut */}
          <g
            className="fill-card stroke-border"
            strokeWidth={num(1 / z)}
            strokeLinejoin="round"
          >
            {LAND_D.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* Rute: halo + garis. Ketebalan & dash dibagi z → ukuran layar tetap saat zoom. */}
          <path
            d={ROUTE_D}
            className="stroke-primary/20"
            fill="none"
            strokeWidth={num(5 / z)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={ROUTE_D}
            className="stroke-primary"
            fill="none"
            strokeWidth={num(1.8 / z)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Rute MCS: halo + garis */}
          <path
            d={MCS_D}
            className="stroke-cable-2/25"
            fill="none"
            strokeWidth={num(5 / z)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={MCS_D}
            className="stroke-cable-2"
            fill="none"
            strokeWidth={num(1.8 / z)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Rute B2JS: halo + garis (putus-putus agar rute yang bertumpuk tetap terbaca) */}
          <path
            d={B2JS_D}
            className="stroke-cable-3/25"
            fill="none"
            strokeWidth={num(5 / z)}
            strokeDasharray={`${num(6 / z)} ${num(4 / z)}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={B2JS_D}
            className="stroke-cable-3"
            fill="none"
            strokeWidth={num(1.8 / z)}
            strokeDasharray={`${num(6 / z)} ${num(4 / z)}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Rute RISING 8: halo + garis (titik-titik, rute keempat di koridor yang sama) */}
          <path
            d={R8_D}
            className="stroke-cable-4/25"
            fill="none"
            strokeWidth={num(5 / z)}
            strokeDasharray={`${num(1.5 / z)} ${num(3.5 / z)}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={R8_D}
            className="stroke-cable-4"
            fill="none"
            strokeWidth={num(1.8 / z)}
            strokeDasharray={`${num(1.5 / z)} ${num(3.5 / z)}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Landing station: dot + label semua kabel (offset diatur, ukuran tetap saat zoom) */}
          {P.map((l) => (
            <g key={l.id}>
              <circle
                cx={l.x}
                cy={l.y}
                r={num(3.5 / z)}
                className={`${l.tone} stroke-card`}
                strokeWidth={num(2 / z)}
              />
              <text
                className={l.tone}
                fontSize={num(9 / z)}
                fontWeight={700}
                letterSpacing={num(0.25 / z)}
                x={l.x + l.dx / z}
                y={l.y + l.dy / z}
                textAnchor={l.anchor ?? (l.dx < 0 ? "end" : "start")}
              >
                {l.label}
              </text>
            </g>
          ))}
        </svg>
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            type="button"
            className={BTN}
            aria-label="Perbesar peta"
            title="Perbesar"
            onClick={() => zoomFromCenter(ZOOM_STEP)}
            disabled={view.k >= ZOOM_MAX}
          >
            <Plus className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className={BTN}
            aria-label="Perkecil peta"
            title="Perkecil"
            onClick={() => zoomFromCenter(1 / ZOOM_STEP)}
            disabled={!zoomed}
          >
            <Minus className="size-4" strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className={BTN}
            aria-label="Reset zoom peta"
            title="Reset"
            onClick={() => setView({ x: 0, y: 0, k: ZOOM_MIN })}
            disabled={!zoomed}
          >
            <RotateCcw className="size-4" strokeWidth={2.5} />
          </button>
        </div>
      </div>
      <ul className="flex flex-col gap-1.5 border-t border-border px-4 py-3 text-[12px] text-muted-foreground">
        {[
          {
            code: "ASC",
            tint: "bg-primary/10 text-primary",
            swatch: "border-primary",
            name: "Australia-Singapore Cable",
            text: "Tanah Merah → Anyer → Flying Fish Cove → Perth",
          },
          {
            code: "MCS",
            tint: "bg-cable-2/10 text-cable-2",
            swatch: "border-cable-2",
            name: "Matrix Cable System",
            text: "Batam → Jakarta → Changi South",
          },
          {
            code: "B2JS",
            tint: "bg-cable-3/10 text-cable-3",
            swatch: "border-cable-3 border-dashed",
            name: "Jakarta-Bangka-Batam-Singapore (B2JS)",
            text: "Batam → Batu Prahu → Jakarta → Pesaren → Tanah Merah",
          },
          {
            code: "R8",
            tint: "bg-cable-4/10 text-cable-4",
            swatch: "border-cable-4 border-dotted",
            name: "RISING 8",
            text: "Tanjung Bemban → Tanjung Pakis → Changi North",
          },
        ].map((c) => (
          <li key={c.code} className="flex items-center gap-2">
            <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] font-semibold ${c.tint}`}>
              {c.code}
            </span>
            <span className={`w-6 shrink-0 self-center border-t-2 ${c.swatch}`} />
            <span>
              <span className="text-foreground/80">{c.name}</span> · {c.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
