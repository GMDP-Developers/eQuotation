# eQuotation — Formulir Permintaan Layanan & Admin Dashboard

Aplikasi 2 halaman:
1. **Form publik** — permintaan layanan → SQLite. Anti-bot honeypot + rate limit 5/menit/IP. Layanan tampil dari DB (hanya yang aktif).
2. **Admin dashboard** — login, tabel + paginasi, filter tanggal/layanan/status, ubah status (BARU→DIPROSES→SELESAI/DITOLAK), hapus, detail per baris, export Excel (server-side), audit trail. Notifikasi email permintaan baru (opsional, SMTP).
3. **Kelola layanan** — `/admin/services`: tambah/edit/hapus layanan (nama, subtitle, deskripsi, urutan, aktif/nonaktif) dengan **2 gambar**: preview (kartu layanan) + full (panel kanan). Upload jpg/png/webp/gif, maks 5MB, tersimpan di `public/images/services/`.

## Stack
Next.js (App Router) · TypeScript · Tailwind + shadcn UI · Prisma + SQLite (WAL) · Auth.js (credentials) · xlsx · nodemailer

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

## Kelola layanan
Semua layanan dikelola dari dashboard `/admin/services` (nama, subtitle, deskripsi, urutan, status aktif) dengan dua gambar per layanan: **gambar preview** (tampil di kartu layanan sisi kiri) dan **gambar full** (tampil di panel kanan, tanpa crop). Jika gambar full belum diisi, panel kanan memakai gambar preview.

Seed (`npm run db:seed`) hanya mengisi 4 layanan default (ULO, Tier One, Intermix, Supermix) **jika belum ada** — editan admin tidak akan ditimpa.

## Script
| Command | Fungsi |
|---------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm run start` | Start production |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:seed` | Seed admin + layanan default (idempoten) |

## Environment (`.env`)
Salin `.env.example` → `.env` lalu isi:
```
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="<openssl rand -base64 32>"
# NEXTAUTH_URL="https://domain-anda.com"   # production saja
AUTH_TRUST_HOST=true
SEED_ADMIN_PASSWORD="admin123"
SMTP_HOST=""            # kosongkan = notifikasi email mati
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
NOTIFY_EMAIL=""
```

> **Production:** wajib ganti `SEED_ADMIN_PASSWORD` — login `admin123` ditolak otomatis
> oleh server saat `NODE_ENV=production`. Setelah ganti `.env`, rotate hash di DB
> (seed tidak menimpa password admin yang sudah ada).
