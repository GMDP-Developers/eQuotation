# Pengambilan Koneksi & Tempat Datacenter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tambah field pengambilan koneksi (datacenter vs diantar via koordinat) di form publik + tampil di admin & export.

**Architecture:** Konstanta + zod conditional di `types`, parser `geo.ts` (TDD), kolom Prisma baru, radio-chip kondisional + Leaflet preview, mapper admin.

**Tech Stack:** Next 16, react-hook-form, zod v4, Prisma/SQLite, leaflet + OSM.

**Spec:** `docs/superpowers/specs/2026-10-12-pengambilan-koneksi-design.md`

---

### Task 1: Parser koordinat (TDD)

**Files:**
- Create: `scripts/geo-check.ts`
- Modify: `package.json` (script `test:geo`)
- Create: `src/lib/geo.ts`

- [ ] **Step 1: Check script dulu**

```ts
// scripts/geo-check.ts
import { parseLocation } from "../src/lib/geo";

const cases: [string, { latitude: number; longitude: number } | null][] = [
  ["-6.2,106.8", { latitude: -6.2, longitude: 106.8 }],
  [" -6.2, 106.8 ", { latitude: -6.2, longitude: 106.8 }],
  ["https://www.google.com/maps/@-6.2008,106.8456,17z", { latitude: -6.2008, longitude: 106.8456 }],
  ["https://www.google.com/maps/place/Jakarta/@-6.1754,106.8272,12z", { latitude: -6.1754, longitude: 106.8272 }],
  ["https://www.google.com/maps?q=-6.2,106.8", { latitude: -6.2, longitude: 106.8 }],
  ["https://www.google.com/maps?ll=-6.2,106.8", { latitude: -6.2, longitude: 106.8 }],
  ["https://maps.app.goo.gl/abc123", null],
  ["https://example.com/@-6.2,106.8", null],
  ["bukan link", null],
  ["", null],
  ["999,106", null],
  ["-6.2,999", null],
];

for (const [input, expected] of cases) {
  const got = parseLocation(input)?.coords ?? null;
  if (JSON.stringify(got) !== JSON.stringify(expected)) {
    console.error("FAIL:", JSON.stringify(input), "got", got, "expected", expected);
    process.exit(1);
  }
}
console.log("geo-check OK");
```

- [ ] **Step 2:** `package.json` scripts tambah `"test:geo": "tsx scripts/geo-check.ts"`.

- [ ] **Step 3:** Run `npm run test:geo` → expected FAIL (module `../src/lib/geo` belum ada).

- [ ] **Step 4: Implement parser**

```ts
// src/lib/geo.ts
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
```

- [ ] **Step 5:** Run `npm run test:geo` → expected `geo-check OK`.

### Task 2: Types & zod

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1:** Tambah setelah `SERVICE_STATUS`:

```ts
export const PICKUP_METHODS = ["DATA_CENTER", "DELIVERY"] as const;
export type PickupMethod = (typeof PICKUP_METHODS)[number];
export const PICKUP_LABELS: Record<PickupMethod, string> = {
  DATA_CENTER: "Koneksi ke Data Center",
  DELIVERY: "Di antar via metro ke titik koordinat",
};
export const DATACENTERS = ["IDC", "Cyber APJII", "Omadata", "Lainnya"] as const;
export type Datacenter = (typeof DATACENTERS)[number];
```

- [ ] **Step 2:** `serviceRequestSchema` — ubah penutup `})` jadi field baru + superRefine; import `parseLocation` dari `@/lib/geo`:

```ts
  pickupMethod: z.enum(PICKUP_METHODS, "Pilih pengambilan koneksi"),
  datacenter: z.enum(DATACENTERS).optional(),
  datacenterOther: z.string().trim().max(120, "Maksimal 120 karakter").optional(),
  location: z.string().trim().max(500, "Maksimal 500 karakter").optional(),
  // Honeypot anti-bot: harus kosong. Isian non-kosong = bot.
  website: z.string().max(0, "Bot terdeteksi").optional(),
}).superRefine((v, ctx) => {
  if (v.pickupMethod === "DATA_CENTER") {
    if (!v.datacenter) {
      ctx.addIssue({ code: "custom", path: ["datacenter"], message: "Pilih tempat datacenter" });
    }
    if (v.datacenter === "Lainnya" && !v.datacenterOther) {
      ctx.addIssue({ code: "custom", path: ["datacenterOther"], message: "Sebutkan datacenter lainnya" });
    }
  }
  if (v.pickupMethod === "DELIVERY") {
    if (!v.location) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Tempel link Google Maps atau isi koordinat" });
    } else if (!parseLocation(v.location)) {
      ctx.addIssue({ code: "custom", path: ["location"], message: "Link tidak terbaca. Pakai link lengkap atau isi koordinat manual (lat,lng)." });
    }
  }
});
```

- [ ] **Step 3:** `ServiceRequestRecord` tambah: `pickupMethod: string; datacenter: string | null; datacenterOther: string | null; location: string | null; latitude: number | null; longitude: number | null; mapsUrl: string | null;`

### Task 3: Prisma migrate

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1:** Di model `ServiceRequest` setelah `notes`:

```prisma
  pickupMethod    String  // 'DATA_CENTER' | 'DELIVERY'
  datacenter      String? // 'IDC' | 'Cyber APJII' | 'Omadata' | 'Lainnya'
  datacenterOther String?
  location        String? // input mentah user
  latitude        Float?
  longitude       Float?
  mapsUrl         String?
```

- [ ] **Step 2:** Run `npm run db:migrate -- --name add_pickup_fields` → expected migration applied, client regenerated.

### Task 4: Submit API

**Files:**
- Modify: `src/app/api/submit/route.ts`

- [ ] **Step 1:** Import `parseLocation` dari `@/lib/geo`.
- [ ] **Step 2:** Di `prisma.serviceRequest.create` data, setelah `notes: data.notes || null,`:

```ts
        pickupMethod: data.pickupMethod,
        datacenter: data.datacenter ?? null,
        datacenterOther: data.datacenterOther || null,
        location: data.location || null,
        mapsUrl: data.location ? parseLocation(data.location)?.mapsUrl ?? null : null,
        latitude: data.location ? parseLocation(data.location)?.coords.latitude ?? null : null,
        longitude: data.location ? parseLocation(data.location)?.coords.longitude ?? null : null,
```

### Task 5: Komponen peta

**Files:**
- Create: `src/components/coords-map.tsx`

- [ ] **Step 1:** `npm install leaflet && npm install -D @types/leaflet`
- [ ] **Step 2:**

```tsx
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
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
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
```

### Task 6: Form publik

**Files:**
- Modify: `src/components/service-request-form.tsx`

- [ ] **Step 1:** Import tambah `DATACENTERS, PICKUP_LABELS, PICKUP_METHODS, type PickupMethod` dari `@/types`, `parseLocation` dari `@/lib/geo`, `CoordsMap` dari `@/components/coords-map`.
- [ ] **Step 2:** `defaultValues` tambah: `pickupMethod: undefined, datacenter: undefined, datacenterOther: "", location: "",`
- [ ] **Step 3:** Setelah `const capacityUnit = watch("capacityUnit");`:

```ts
  const pickupMethod = watch("pickupMethod");
  const datacenter = watch("datacenter");
  const locationValue = watch("location");
  const parsedLocation = locationValue ? parseLocation(locationValue) : null;
```

- [ ] **Step 4:** Helper sebelum `onSubmit`:

```ts
  function setPickup(m: PickupMethod) {
    setValue("pickupMethod", m, { shouldValidate: true });
    if (m === "DATA_CENTER") {
      setValue("location", "", { shouldValidate: true });
    } else {
      setValue("datacenter", undefined, { shouldValidate: true });
      setValue("datacenterOther", "", { shouldValidate: true });
    }
  }
```

- [ ] **Step 5:** Section baru — sisipkan SETELAH section "Pilih Layanan" (tutup `</section>` ~baris 460), SEBELUM section "Kapasitas":

```tsx
      <section className="reveal-up reveal-delay-2 flex flex-col gap-4">
        <SectionTitle required>Pengambilan Koneksi</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Pengambilan koneksi">
          {PICKUP_METHODS.map((m) => {
            const selected = pickupMethod === m;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setPickup(m)}
                className={cn(
                  "min-h-[42px] rounded-xl border px-3 py-2.5 text-center text-[13px] font-medium leading-tight shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/10",
                  selected
                    ? "border-[#8c7d6b] bg-[#8c7d6b] text-white"
                    : "border-[#e8e0d6] bg-[#fdfcfa] text-[#6b5f55] hover:border-[#d6c8b8] hover:bg-[#faf6f1]"
                )}
              >
                {PICKUP_LABELS[m]}
              </button>
            );
          })}
        </div>
        <FieldError message={errors.pickupMethod?.message} />

        {pickupMethod === "DATA_CENTER" ? (
          <div className="flex flex-col gap-3">
            <SectionTitle required>Tempat Datacenter</SectionTitle>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Tempat datacenter">
              {DATACENTERS.map((d) => {
                const selected = datacenter === d;
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setValue("datacenter", d, { shouldValidate: true })}
                    className={cn(
                      "min-h-[42px] rounded-xl border px-3 py-2.5 text-center text-[13px] font-medium shadow-sm transition-all",
                      selected
                        ? "border-[#8c7d6b] bg-[#8c7d6b] text-white"
                        : "border-[#e8e0d6] bg-[#fdfcfa] text-[#6b5f55] hover:border-[#d6c8b8]"
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            <FieldError message={errors.datacenter?.message} />
            {datacenter === "Lainnya" ? (
              <Field
                id="datacenterOther"
                label="Sebutkan datacenter lainnya"
                placeholder="Nama datacenter lain"
                error={errors.datacenterOther?.message}
                required
                {...register("datacenterOther")}
              />
            ) : null}
          </div>
        ) : null}

        {pickupMethod === "DELIVERY" ? (
          <div className="flex flex-col gap-3">
            <Label htmlFor="location" className="text-[13px]">
              Titik Koordinat<span className="ml-0.5 text-destructive">*</span>
            </Label>
            <Input
              id="location"
              placeholder="Tempel link Google Maps atau ketik -6.2,106.8"
              className={inputClass}
              {...register("location")}
            />
            <p className="text-[12px] text-muted-foreground">
              Buka Google Maps → Share → Copy link, lalu tempel di sini.
            </p>
            <FieldError message={errors.location?.message} />
            {parsedLocation ? (
              <CoordsMap
                coords={parsedLocation.coords}
                className="h-48 w-full rounded-lg border bg-white"
              />
            ) : null}
          </div>
        ) : null}
      </section>
```

- [ ] **Step 6:** `npm run lint` → lolos.

### Task 7: Mapping admin (dashboard + spreadsheet)

**Files:**
- Modify: `src/app/admin/dashboard/page.tsx:84-98`
- Modify: `src/app/admin/spreadsheet/page.tsx:15-29`

- [ ] Di KEDUA mapper, setelah `notes: r.notes,`:

```ts
    pickupMethod: r.pickupMethod,
    datacenter: r.datacenter,
    datacenterOther: r.datacenterOther,
    location: r.location,
    latitude: r.latitude,
    longitude: r.longitude,
    mapsUrl: r.mapsUrl,
```

### Task 8: Detail expand dashboard

**Files:**
- Modify: `src/components/admin/requests-dashboard.tsx`

- [ ] Import `PICKUP_LABELS` dari `@/types` (gabung import line 19) + `import { CoordsMap } from "@/components/coords-map";`
- [ ] Di grid detail expand, SETELAH blok Status (~line 495):

```tsx
                            <div>
                              <p className="text-muted-foreground">
                                Pengambilan Koneksi
                              </p>
                              <p className="font-medium">
                                {PICKUP_LABELS[r.pickupMethod as keyof typeof PICKUP_LABELS] ?? r.pickupMethod}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Tempat Datacenter
                              </p>
                              <p className="font-medium">
                                {r.datacenter
                                  ? r.datacenter === "Lainnya"
                                    ? r.datacenterOther || "Lainnya"
                                    : r.datacenter
                                  : "—"}
                              </p>
                            </div>
                            {r.latitude != null && r.longitude != null ? (
                              <div className="sm:col-span-2 lg:col-span-4">
                                <p className="text-muted-foreground">
                                  Titik Koordinat
                                </p>
                                <p className="font-medium">
                                  {r.latitude}, {r.longitude}{" "}
                                  <a
                                    className="text-primary underline underline-offset-2"
                                    target="_blank"
                                    rel="noreferrer"
                                    href={
                                      r.mapsUrl ??
                                      `https://www.google.com/maps?q=${r.latitude},${r.longitude}`
                                    }
                                  >
                                    Buka di Google Maps
                                  </a>
                                </p>
                                <CoordsMap
                                  coords={{ latitude: r.latitude, longitude: r.longitude }}
                                  className="mt-2 h-48 w-full max-w-xl rounded-lg border bg-white"
                                />
                              </div>
                            ) : null}
```

### Task 9: Kolom spreadsheet

**Files:**
- Modify: `src/components/admin/requests-sheet.tsx`

- [ ] `ColKey` union tambah `| "pickup"`; `COLS` sisipkan setelah `capacity`:

```ts
  { key: "pickup", label: "PENGAMBILAN", w: "min-w-[170px]" },
```

- [ ] Helper sebelum `getSortValue`:

```ts
function pickupValue(r: ServiceRequestRecord): string {
  if (r.pickupMethod === "DATA_CENTER") {
    if (!r.datacenter) return "";
    return r.datacenter === "Lainnya"
      ? `Lainnya — ${r.datacenterOther ?? ""}`.trim()
      : r.datacenter;
  }
  if (r.latitude != null && r.longitude != null) return `${r.latitude}, ${r.longitude}`;
  return "";
}
```

- [ ] `getSortValue` tambah awal: `if (k === "pickup") return pickupValue(r).toLowerCase();`
- [ ] Filter search (~line 66) tambah `pickupValue(r)` ke array join.
- [ ] Render cell — sisipkan setelah cell `capacity` (~line 223):

```tsx
                  <td className="max-w-[170px] truncate border-b border-r border-[#e5e7eb] px-2 py-1.5 whitespace-nowrap text-[#111827]">
                    {pickupValue(r) || "—"}
                  </td>
```

### Task 10: Export xlsx

**Files:**
- Modify: `src/app/api/requests/export/route.ts`

- [ ] Import `PICKUP_LABELS` dari `@/types`.
- [ ] `data` map — sisipkan setelah `Kapasitas:`:

```ts
      Pengambilan:
        PICKUP_LABELS[r.pickupMethod as keyof typeof PICKUP_LABELS] ?? r.pickupMethod,
      DataCenter: r.datacenter
        ? r.datacenter === "Lainnya"
          ? `Lainnya — ${r.datacenterOther ?? ""}`
          : r.datacenter
        : "",
      Koordinat:
        r.latitude != null && r.longitude != null
          ? `${r.latitude}, ${r.longitude}`
          : "",
      Link:
        r.mapsUrl ??
        (r.latitude != null && r.longitude != null
          ? `https://www.google.com/maps?q=${r.latitude},${r.longitude}`
          : ""),
```

- [ ] header jadi: `["Dibuat","Perusahaan","Kontak","Jabatan","Telepon","Email","Layanan","Kapasitas","Pengambilan","Data Center","Koordinat","Link","Status","Catatan"]` (14).
- [ ] `!cols` 14 entri: `{ wch: 18 },{ wch: 24 },{ wch: 18 },{ wch: 16 },{ wch: 16 },{ wch: 26 },{ wch: 14 },{ wch: 14 },{ wch: 20 },{ wch: 16 },{ wch: 22 },{ wch: 40 },{ wch: 12 },{ wch: 32 }`.
- [ ] `const endCol = "N";`

### Task 11: Verifikasi akhir

- [ ] `npm run test:geo` → `geo-check OK`
- [ ] `npm run lint` → tanpa error
- [ ] `npm run build` → sukses
- [ ] Manual `npm run dev`: submit form dua branch (datacenter + delivery), cek `/admin/dashboard` (expand), `/admin/spreadsheet`, export xlsx.
