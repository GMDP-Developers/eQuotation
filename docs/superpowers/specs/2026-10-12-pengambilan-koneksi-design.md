# Spec: Pengambilan Koneksi & Tempat Datacenter

Tanggal: 2026-10-12
Status: approved (revisi menyusul)

## Context

Form permintaan publik (`src/components/service-request-form.tsx`) belum punya info cara pengambilan koneksi. Sekarang hanya bisa lewat free-text `notes`.

## User flow

1. Section baru **"Pengambilan Koneksi"** (required), setelah "Pilih Layanan", sebelum "Kapasitas". Radio-chip 2 opsi:
   - **Koneksi ke Data Center** → muncul **Tempat Datacenter** (required): `IDC` / `Cyber APJII` / `Omadata` / `Lainnya`. Pilih `Lainnya` → input teks wajib.
   - **Di antar via metro ke titik koordinat** → 1 input wajib: tempel link Google Maps **atau** ketik `lat,lng` manual. Di-parse → preview Leaflet dengan marker.
2. Ganti pilihan method → branch lain di-clear (nilai & error hilang).
3. Submit → simpan ke `ServiceRequest`.

## Data model (Prisma `ServiceRequest`)

| Field | Tipe | Notes |
|---|---|---|
| `pickupMethod` | `String` | `DATA_CENTER` \| `DELIVERY` |
| `datacenter` | `String?` | `IDC` \| `Cyber APJII` \| `Omadata` \| `Lainnya` |
| `datacenterOther` | `String?` | isi saat `Lainnya` |
| `location` | `String?` | input mentah user (link / "lat,lng") |
| `latitude` / `longitude` | `Float?` | hasil parse |
| `mapsUrl` | `String?` | link Google Maps asli (null bila input manual) |

## Validasi (zod `superRefine`)

- `pickupMethod` wajib.
- `DATA_CENTER` → `datacenter` wajib; `Lainnya` → `datacenterOther` wajib (min 1 char).
- `DELIVERY` → `location` wajib dan `parseLocation(location)` harus berhasil.
- Range: lat −90..90, lng −180..180.

## Parsing (`src/lib/geo.ts`)

Format diterima:

1. Murni `lat,lng` (desimal), mis. `-6.2,106.8` → `mapsUrl = null`
2. URL host `google.*`/`goo.gl` berisi `@lat,lng`, atau query `?q=lat,lng` / `?ll=lat,lng`

Ditolak (return `null`): link pendek `maps.app.goo.gl` tanpa koordinat, host non-Google, angka di luar range, string kosong. Pesan error: "Link tidak terbaca. Pakai link lengkap atau isi koordinat manual (lat,lng)."

## Map

- `leaflet` saja (tanpa react-leaflet) + `@types/leaflet`. Tile OpenStreetMap — gratis, tanpa API key.
- Komponen client `src/components/coords-map.tsx`: dynamic `import("leaflet")` inside `useEffect` (aman SSR), marker pakai `L.divIcon` (hindari masalah aset marker bawaan leaflet), cleanup `map.remove()`.
- Dipakai 2x: preview di form (saat koordinat valid), mini map di detail admin.

## Admin

- **Dashboard expand** (`requests-dashboard.tsx`): baris "Pengambilan Koneksi", "Tempat Datacenter" (atau "—"), bila DELIVERY → teks `lat, lng` + link "Buka di Google Maps" (`mapsUrl` fallback `https://www.google.com/maps?q=lat,lng`) + `CoordsMap` mini `h-48`.
- **Spreadsheet** (`requests-sheet.tsx`): kolom `PENGAMBILAN` — isi: datacenter (atau `Lainnya — <teks>`), atau `lat,lng`. Ikut search & sort.
- **Export xlsx**: kolom baru `Pengambilan`, `Data Center`, `Koordinat`, `Link`.

## Out of scope

- Filter admin per pengambilan/datacenter.
- Server-side resolver link pendek.
- Perubahan field `notes`.

## Verification

`npm run test:geo` (assert parser), `npm run lint`, `npm run build`. Checklist manual: submit kedua branch, cek admin + export.
