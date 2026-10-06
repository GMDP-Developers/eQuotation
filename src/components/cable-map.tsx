"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

// ASC route (lon, lat), Singapore → Anyer; source: submarinecablemap.com cable-geo.json, 2026-10-05.
// Jalur Australia/Perth & spur Christmas Island dihapus atas permintaan.
const ROUTE: [number, number][] = [
  [103.946, 1.327], [103.781, 1.019], [103.781, 0.794], [104.175, 0.513],
  [104.85, 0.401], [105.3, 0.119], [105.975, -0.781], [106.764, -2.131],
  [107.016, -3.03], [106.987, -4.601], [106.537, -5.162], [106.312, -5.498],
  [105.75, -5.946], [105.8839, -6.0737],
];

// MCS route (lon, lat), Singapore ↔ Jakarta; source: submarinecablemap.com cable-geo.json, 2026-10-05
// 2 segments (MultiLineString): Jakarta → Selat Sunda → Singapura; cabang via Batam dihapus atas permintaan.
const MCS: [number, number][][] = [
  [[106.833, -6.172], [106.875, -5.274], [107.325, -4.601], [107.213, -3.03], [107.098, -2.131], [106.762, -0.331], [105.3, 1.131]],
  [[105.3, 1.131], [104.85, 1.243], [104.625, 1.229], [104.194, 1.295], [103.987, 1.389]],
];

// B2JS route (lon, lat), Jakarta → Bangka → Singapura; source: submarinecablemap.com
// cable-geo.json, 2026-10-05 — jalur via Batam dihapus atas permintaan (langsung Bangka → Singapura);
// warna oranye (upstream #31b34a) agar tidak bentrok dengan MCS.
const B2JS: [number, number][] = [
  [106.828, -6.172], [106.425, -5.274], [106.65, -4.601], [106.762, -3.479], [106.547, -3.08],
  [106.312, -2.581], [105.862, -1.906], [105.583, -1.554], [105.525, -1.231], [104.85, -0.35],
  [104.2, 0.5], [103.946, 1.327],
];

// RISING 8 route (lon, lat), Singapore ↔ Tanjung Bemban/Tanjung Pakis; source:
// submarinecablemap.com cable-geo.json, 2026-10-05 — 2 segmen (MultiLineString),
// warna magenta mengikuti upstream #954098.
const R8: [number, number][][] = [
  [[104.133, 1.174], [103.987, 1.375]],
  [[107.121, -5.981], [106.411, -4.603], [106.979, -2.961], [106.516, -1.514], [105.407, 0.176],
  [104.941, 0.723], [104.538, 0.869], [104.133, 1.174]],
];

// OWN — kabel milik sendiri, Jakarta → Surabaya via Laut Jawa (pantai utara Jawa);
// jalur laut internal, bukan rute publik submarinecablemap.com.
const OWN: [number, number][] = [
  [106.828, -6.172], [107.4, -6.05], [108.2, -6.05], [109.0, -6.35], [109.9, -6.55],
  [110.7, -6.35], [111.5, -6.45], [112.2, -6.55], [112.7538, -7.2573],
];

// Titik awal (Singapura), titik akhir kabel (Anyer, Jakarta, Tanjung Pakis), dan
// landing kabel milik sendiri (Surabaya); titik perantara lain dihapus atas permintaan.
// submarinecablemap.com landing-point-geo.json 2026-10-05 (OWN: jalur internal).
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
  { id: "anyer-indonesia", label: "ANYER", tone: "fill-primary", at: [105.8839, -6.0737], dx: -7, dy: -9 },
  // MCS (Matrix Cable System)
  { id: "jakarta-indonesia", label: "JAKARTA", tone: "fill-cable-2", at: [106.8279, -6.1716], dx: 0, dy: 15, anchor: "middle" },
  // RISING 8
  { id: "tanjung-pakis-indonesia", label: "TANJUNG PAKIS", tone: "fill-cable-4", at: [107.1209, -5.9813], dx: 7, dy: 5 },
  // OWN (kabel milik sendiri)
  { id: "surabaya-indonesia", label: "SURABAYA", tone: "fill-cable-5", at: [112.7538, -7.2573], dx: 7, dy: 12 },
];

// Land outlines (lon, lat): Natural Earth 1:50m, world-atlas@2 countries-50m.json —
// 9 Indonesia rings, 1 Singapore; Douglas–Peucker 0.14° (IDN) & 0.003° (SGP);
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
  [[103.65, 1.33], [103.7, 1.42], [103.82, 1.45], [103.91, 1.42], [103.96, 1.39], [104, 1.37], [103.97, 1.33], [103.82, 1.27], [103.65, 1.33]],
];

// Equirectangular with cos(mid-lat) correction; OX/OY menaruh rute di tengah bingkai 520 lebar.
const VIEW = 520;
const LON0 = 103.0, LON1 = 113.7, LAT0 = -17.8, LAT1 = 1.55;
const KX = Math.cos((-8.125 * Math.PI) / 180); // ≈0.9899
const K = (VIEW * 0.96) / (LAT1 - LAT0); // ≈25.80 px/deg latitude
const W = (LON1 - LON0) * KX * K; // ≈273 px route width
const OX = (VIEW - W) / 2; // ≈123
const OY = (VIEW - (LAT1 - LAT0) * K) / 2; // ≈10
const px = ([lon, lat]: [number, number]) =>
  `${(OX + (lon - LON0) * KX * K).toFixed(1)},${(OY + (LAT1 - lat) * K).toFixed(1)}`;
const P = LANDINGS.map((l) => ({
  ...l,
  x: OX + (l.at[0] - LON0) * KX * K,
  y: OY + (LAT1 - l.at[1]) * K,
}));

const ROUTE_D = "M" + ROUTE.map(px).join(" L");
const LAND_D = LAND.map((ring) => "M" + ring.map(px).join(" L") + " Z");
const MCS_D = MCS.map((l) => "M" + l.map(px).join(" L")).join(" ");
const B2JS_D = "M" + B2JS.map(px).join(" L");
const R8_D = R8.map((l) => "M" + l.map(px).join(" L")).join(" ");
const OWN_D = "M" + OWN.map(px).join(" L");

/**
 * Bingkai 16:8. Semua rute & titik landing muat di viewBox awal (Singapura–Jawa–Surabaya);
 * CONTENT menahan geser tetap di area peta.
 */
type View = { x: number; y: number; k: number };
const FRAME_W = VIEW;
const FRAME_H = (FRAME_W * 8) / 16;
const CONTENT = { x: 0, y: 0, w: 540, h: 320 };
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
            {[105, 110].map((lon) => {
              const a = px([lon, LAT0]).split(",");
              const b = px([lon, LAT1]).split(",");
              return <line key={lon} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
            })}
            {[0, -5, -10, -15].map((lat) => {
              const a = px([LON0, lat]).split(",");
              const b = px([LON1, lat]).split(",");
              return <line key={lat} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
            })}
          </g>

          {/* Daratan: Indonesia & Singapura — di atas graticule, terang di atas laut */}
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

          {/* Rute OWN: halo + garis (putus-putus panjang, kabel milik sendiri → Surabaya via Laut Jawa) */}
          <path
            d={OWN_D}
            className="stroke-cable-5/25"
            fill="none"
            strokeWidth={num(5 / z)}
            strokeDasharray={`${num(10 / z)} ${num(5 / z)}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={OWN_D}
            className="stroke-cable-5"
            fill="none"
            strokeWidth={num(1.8 / z)}
            strokeDasharray={`${num(10 / z)} ${num(5 / z)}`}
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
            text: "Tanah Merah → Anyer",
          },
          {
            code: "MCS",
            tint: "bg-cable-2/10 text-cable-2",
            swatch: "border-cable-2",
            name: "Matrix Cable System",
            text: "Jakarta → Changi South",
          },
          {
            code: "B2JS",
            tint: "bg-cable-3/10 text-cable-3",
            swatch: "border-cable-3 border-dashed",
            name: "Jakarta-Bangka-Singapore (B2JS)",
            text: "Jakarta → Bangka → Tanah Merah",
          },
          {
            code: "R8",
            tint: "bg-cable-4/10 text-cable-4",
            swatch: "border-cable-4 border-dotted",
            name: "RISING 8",
            text: "Tanjung Bemban → Tanjung Pakis → Changi North",
          },
          {
            code: "OWN",
            tint: "bg-cable-5/10 text-cable-5",
            swatch: "border-cable-5 border-dashed",
            name: "OWN (kabel milik sendiri)",
            text: "Jakarta → Surabaya (via Laut Jawa)",
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
