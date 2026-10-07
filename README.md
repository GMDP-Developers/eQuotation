# eQuotation — Formulir Permintaan Layanan & Admin Dashboard

Aplikasi 2 halaman:
1. **Form publik** — permintaan layanan → SQLite. Anti-bot honeypot + rate limit 5/menit/IP. Layanan tampil dari DB (hanya yang aktif).
2. **Admin dashboard** — login, tabel + paginasi, filter tanggal/layanan/status, ubah status (BARU→DIPROSES→SELESAI/DITOLAK), hapus, detail per baris, export Excel (server-side), audit trail.
3. **Kelola layanan** — `/admin/services`: tambah/edit/hapus layanan (nama, subtitle, deskripsi, urutan, aktif/nonaktif) dengan 2 gambar: preview (kartu layanan) + full (panel kanan). Upload jpg/png/webp/gif, maks 5MB, tersimpan di `public/images/services/`.
4. **Pengaturan halaman & brand** — `/admin/settings`: nama brand, keterangan, dan logo (opsional; berlaku di semua permukaan — header publik, halaman login, sidebar admin, judul tab; kosong = ikon default), serta judul, deskripsi, poin, dan gambar panel "Tentang" halaman publik.

## Stack
Next.js (App Router) · TypeScript · Tailwind + shadcn UI · Prisma + SQLite (WAL) · Auth.js (credentials) · xlsx

## Cara Install Lengkap

### Prasyarat
- Node.js 20+ (cek `node -v`), npm 10+
- Git

### 1. Buat VM di Proxmox
Buat LXC/VM Ubuntu 22.04/24.04, RAM 1GB+, disk 10GB. Pastikan dapat IP privat (mis. `10.202.10.15`). Untuk akses publik, buat DNAT di Proxmox/firewall:
```
IP_PUBLIK:80  → 10.202.10.15:3000
IP_PUBLIK:443 → 10.202.10.15:3000  (jika pakai TLS)
```
Atau pakai Nginx reverse-proxy di depan. Tidak perlu config `NEXTAUTH_URL` — `trustHost:true` sudah aktif otomatis ikut `Host` publik.

### 2. Clone & Install
```bash
apt update && apt install -y nodejs npm git
# jika Node <20, install via NodeSource:
# curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y nodejs

git clone <repo-url> equotation
cd equotation
npm install
# postinstall otomatis: prisma generate
```

> Jika `npm install` diblokir script Prisma: `npm install --foreground-scripts` atau manual `npx prisma generate`.

### 3. Setup Database (Sekali di VM Baru)
```bash
npm run setup
```
`setup` = `node scripts/setup-env.mjs` + `prisma migrate deploy` + `prisma db seed`:
- Buat `.env` jika belum ada (generate `NEXTAUTH_SECRET` random 32 byte). Jika `.env` sudah ada tapi masih `dev-secret...`, akan di-random otomatis.
- Buat semua tabel SQLite `prisma/prod.db`.
- Seed admin `admin / admin123` + 9 layanan + setting brand (idempoten — tidak timpa editan admin saat re-run).

Cek `.env` yang terbuat:
```
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="<random base64 32>"
AUTH_TRUST_HOST=true
SEED_ADMIN_PASSWORD="admin123"
```

> Production: ganti `SEED_ADMIN_PASSWORD` di `.env` sebelum seed ulang, atau langsung reset via CLI (lihat bawah).

### 4. Mode Development (Laptop / Testing di VM)
```bash
npm run dev
# → http://localhost:3000  atau  http://10.202.10.15:3000
# hot-reload, tidak di-minify, bisa login admin/admin123
```
Jika `next dev` diblokir saat diakses dari IP LAN lain:
```bash
# di .env
ALLOWED_DEV_ORIGINS="10.202.10.15,IP_PUBLIK_ANDA"
npm run dev
```
`ALLOWED_DEV_ORIGINS` hanya berpengaruh di `dev`, tidak di `production`.

### 5. Mode Production (VM Proxmox — Tinggal Ganti dev → Production)
```bash
npm run build
npm start
# → NODE_ENV=production otomatis (Next 16)
# listen 0.0.0.0:3000

# atau eksplisit:
NODE_ENV=production npm run build && NODE_ENV=production npm start
```
Akses: `http://IP_VM:3000` (lokal) atau `http://IP_PUBLIK` (via DNAT). Tidak perlu set `NEXTAUTH_URL` — `AUTH_TRUST_HOST=true` bikin Auth.js ikut `Host` publik, tidak akan `MissingCSRF`.

**Update code setelah `git pull`:**
```bash
git pull
npm install
npm run build
npm start   # atau pm2 restart / systemctl restart equotation
```

**Jalankan sebagai service (opsional, agar hidup setelah reboot):**
```bash
# dengan pm2
npm i -g pm2
pm2 start npm --name equotation -- start
pm2 save && pm2 startup

# atau systemd: buat /etc/systemd/system/equotation.service
# ExecStart=/usr/bin/npm start  WorkingDirectory=/opt/equotation
```

> Jalankan `npm run dev` atau `npm run build` sekali sebelum typecheck/CI (type `LayoutProps` di-generate ke `.next/types`).

### 6. Beda Development vs Production

|  | `npm run dev` (`NODE_ENV=development`) | `npm run build && npm start` (`NODE_ENV=production`) |
|---|---|---|
| Performa | Lambat, source map, hot-reload | Minify + cache, 10/10 static pages |
| Login `admin/admin123` | **Bisa** | **Ditolak** — `src/lib/auth.ts` blokir `admin123` di production |
| `SEED_ADMIN_PASSWORD` | Default `admin123` boleh | Wajib ganti di `.env` |
| `ALLOWED_DEV_ORIGINS` | Aktif — untuk akses LAN/IP lain | Tidak berpengaruh |
| `AUTH_TRUST_HOST` | `true` | `true` — sama (ikut Host NAT) |
| Prisma | `prisma migrate dev` (buat migration baru) | `prisma migrate deploy` (apply saja, dipakai `setup`) |

**Cara ganti:** cukup ganti command. Tidak ada file lain yang perlu diedit untuk NAT.

Jika lupa password di server production (tidak bisa login karena `admin123` ditolak):
```bash
npm run admin:reset-password -- admin PasswordBaru123
```

### 7. Catatan NAT / Reverse Proxy
- **DNAT murni** (`IP_PUBLIK → 10.x:3000`): tanpa Nginx, cukup `AUTH_TRUST_HOST=true` — sudah handle.
- **Nginx di depan `next start`**: wajib forward header agar tidak `MissingCSRF` / cookie `__Secure-` mismatch:
```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Proto $scheme;  # https bila publik TLS
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_pass http://10.202.10.15:3000;
```
- Jika publik pakai `https` tapi app `http` di balik Nginx, `X-Forwarded-Proto: https` wajib — kalau tidak, Auth.js set cookie non-Secure tapi browser minta Secure → login loop.

## Login Admin
- Username: `admin`
- Password: `admin123` (atau nilai `SEED_ADMIN_PASSWORD` di `.env`)
- Halaman: `/login` → `/admin/dashboard`
- Lupa password di server: `npm run admin:reset-password -- admin PasswordBaru123`
- Ganti password/username dari dashboard: `/admin/account` (butuh password lama; ganti password akan logout sesi lain otomatis, daftar sesi tampil di bawah form)

## Kelola Layanan
Semua layanan dikelola dari dashboard `/admin/services` (nama, subtitle, deskripsi, urutan, status aktif) dengan dua gambar per layanan: **gambar preview** (tampil di kartu layanan sisi kiri) dan **gambar full** (tampil di panel kanan, tanpa crop). Jika gambar full belum diisi, panel kanan memakai gambar preview.

Seed (`npm run db:seed`) hanya mengisi 9 layanan + setting brand (idempoten — tidak timpa editan admin).

## Script
| Command | Fungsi |
|---------|--------|
| `npm run dev` | Dev server |
| `npm run build` | Build production |
| `npm start` | Start production (`NODE_ENV=production`) |
| `npm run setup` | **VM baru:** `.env` + migrate + seed (sekali, idempoten) |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Seed admin + layanan (idempoten) |
| `npm run admin:reset-password -- <user> <pass>` | Reset password via terminal (tanpa password lama) |

## Environment (`.env`)
`npm run setup` sudah buat `.env` otomatis. Isinya:
```
DATABASE_URL="file:./prod.db"
NEXTAUTH_SECRET="<random 32 byte>"
AUTH_TRUST_HOST=true
SEED_ADMIN_PASSWORD="admin123"
# Opsional dev: ALLOWED_DEV_ORIGINS="10.202.10.15"
```
> Production: ganti `SEED_ADMIN_PASSWORD` lalu `npm run admin:reset-password -- admin <pass-baru>` (seed tidak timpa password yang sudah ada, dan `admin123` ditolak saat `NODE_ENV=production`).
