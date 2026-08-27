# tanahmalaya.org — Pertubuhan Literasi Tanah (PLT)

Website rasmi Pertubuhan Literasi Tanah — No. Pendaftaran PPM-001-10-17042026.

## Ciri-ciri

- Laman awam: Utama, Tentang Kami, Keahlian, kelas dan program, Merchandise, Aktiviti, Hubungi Kami
- Borang keahlian + pembayaran BayarCash
- Dashboard admin (`/admin`) — urus kelas, aktiviti, merchandise, senarai ahli, iklan komuniti
- Iklan komuniti auto-rotate (roofman, jomnikah, barang thai, dll)

## 1. Pasang dependency

```bash
npm install
```

## 2. Setup database

Guna Postgres percuma dari [Supabase](https://supabase.com), [Neon](https://neon.tech), atau [Railway](https://railway.app) — senang untuk mula, tak perlu pasang server sendiri.

Salin `.env.example` jadi `.env` dan isi:

```bash
cp .env.example .env
```

Isi `DATABASE_URL` dengan connection string dari pembekal database Tuan.

Jana JWT_SECRET rawak:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Salin hasil tu ke `JWT_SECRET` dalam `.env`.

## 3. Cipta jadual database

```bash
npm run db:push
```

## 4. Cipta akaun admin pertama

```bash
node scripts/create-admin.js "nama@tanahmalaya.org" "kata-laluan-kuat"
```

## 5. Setup BayarCash

1. Daftar akaun di [bayarcash.com](https://bayarcash.com) (mula dengan sandbox untuk ujian)
2. Dapatkan **API Token**, **Portal Key**, dan **Secret Key** dari portal Business > API Settings
3. Isi ketiga-tiga nilai dalam `.env`
4. Bila dah siap ujian, tukar `BAYARCASH_API_URL` dalam `lib/bayarcash.ts` daripada sandbox ke production URL

## 6. Jalankan secara local untuk ujian

```bash
npm run dev
```

Buka http://localhost:3000 untuk laman awam, dan http://localhost:3000/admin untuk dashboard.

## 7. Letak gambar sebenar

Gantikan placeholder di `public/hero-geran.jpg` dengan gambar geran hakmilik sebenar, dan muat naik logo/gambar produk/aktiviti melalui dashboard admin (medan URL gambar — boleh guna perkhidmatan seperti Cloudinary/UploadThing untuk hosting gambar).

## 8. Deploy

Cadangan paling senang: **Vercel** (dibuat oleh pencipta Next.js, percuma untuk mula).

1. Push kod ni ke GitHub
2. Import repo ke [vercel.com](https://vercel.com)
3. Masukkan semua environment variable dari `.env` dalam tetapan projek Vercel
4. Tambah domain `tanahmalaya.org` dalam tetapan domain Vercel, dan kemas kini DNS domain Tuan ikut arahan yang diberi

## Struktur folder

```
app/              - semua laman & API routes (Next.js App Router)
  admin/          - dashboard admin (perlu login)
  api/            - API routes (members, classes, products, ads, BayarCash)
components/       - komponen UI boleh guna semula
lib/              - Prisma client, BayarCash helper, admin auth
prisma/           - skema database
scripts/          - skrip utiliti (cipta admin pertama)
```
