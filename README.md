# eQuotation — Formulir Permintaan Layanan & Admin Dashboard

Aplikasi 2 halaman:
1. **Form publik** — permintaan layanan (ULO, Tier One, Intermix, Supermix) → SQLite
2. **Admin dashboard** — login, lihat tabel, filter, export Excel (.xlsx)

## Stack
Next.js (App Router) · TypeScript · Tailwind + shadcn UI · Prisma + SQLite (WAL) · Auth.js (credentials) · xlsx

## Menjalankan

```bash
npm install                 # postinstall: prisma generate
npx prisma db seed          # buat admin
npm run dev                 # http://localhost:3000
```

> Jalankan `npm run dev` atau `npm run build` **sekali** sebelum typecheck/CI
> (type `LayoutProps` di-generate Next ke `.next/types`).
> WAL mode SQLite aktif otomatis saat aplikasi start.

> Jika npm memblokir install script Prisma: `npm install --foreground-scripts`
> atau jalankan manual: `npx prisma generate && npm run db:seed`

## Login admin
- Username: `admin`
- Password: `admin123` (atau nilai `SEED_ADMIN_PASSWORD` di `.env`)
- Halaman: `/login` → `/admin/dashboard`

## Diagram layanan (opsional)
Letakkan JPG/PNG di `public/images/services/`:

```
ulo.jpg
tier-one.jpg
intermix.jpg
supermix.jpg
```

Jika file belum ada, UI otomatis memakai ikon.

## Script
| Command | Fungsi |
|---------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run start` | Start production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:seed` | Seed admin |

## Environment (`.env`)
Salin `.env.example` → `.env` lalu isi:
```
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
# NEXTAUTH_URL="https://domain-anda.com"   # production saja
AUTH_TRUST_HOST=true
SEED_ADMIN_PASSWORD="admin123"
```
