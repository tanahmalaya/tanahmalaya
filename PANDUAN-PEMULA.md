# Panduan Lengkap Untuk Pemula — Website tanahmalaya.org

Panduan ni untuk Tuan yang baru pertama kali buat website jenis ni. Ikut je
turutan dari atas ke bawah, jangan skip mana-mana langkah. Setiap langkah ada
penjelasan apa yang sedang berlaku dan kenapa.

---

## Bahagian 0: Fahami dulu apa yang kita buat

Website ni ada 3 bahagian Utama:

1. **Frontend** — apa yang pelawat nampak (laman Utama, borang, dll)
2. **Backend** — "otak" yang proses data (API)
3. **Database** — tempat simpan semua data (ahli, kelas, produk, dll) —
   kita guna servis luar bernama **Supabase** untuk ni (percuma)

Semua 3 ni berjalan sekali bila Tuan taip `npm run dev`.

---

## Bahagian 1: Pasang alat asas

### 1.1 Node.js
Kalau dah download & install, sahkan ia berjaya:

1. Buka **Command Prompt** (Windows) atau **Terminal** (Mac)
2. Taip: `node -v` lalu Enter
3. Patut keluar nombor macam `v20.11.0` — kalau keluar error, install semula
   Node.js dan **restart komputer** selepas install

### 1.2 Buka folder projek dalam Terminal
1. Extract fail `tanahmalaya-nextjs.zip` ke Desktop
2. Buka folder `tanahmalaya` tu dalam File Explorer/Finder
3. **Windows**: klik pada address bar (bahagian atas yang tunjuk lokasi
   folder), padam apa yang tertulis, taip `cmd`, tekan Enter — Command
   Prompt akan terbuka terus di folder ni
4. **Mac**: buka Terminal biasa, taip `cd ` (dengan ruang selepas cd), then
   drag folder `tanahmalaya` masuk ke Terminal, tekan Enter

Dari sini, **setiap arahan** dalam panduan ni kena run dalam Terminal yang
sama ni, sebab ia dah berada "di dalam" folder projek.

### 1.3 Pasang semua library projek
Taip:
```
npm install
```
Tunggu sampai siap (1-3 minit). Kalau keluar banyak baris hijau/kuning tu
normal — hanya risau kalau ada baris merah bertulis "error".

---

## Bahagian 2: Setup Database (Supabase)

### 2.1 Cipta akaun & projek
1. Pergi ke [supabase.com](https://supabase.com), daftar akaun (boleh guna
   Google/GitHub untuk cepat)
2. Klik **New Project**
3. Isi nama projek (cth: `tanahmalaya`)
4. Set **Database Password** — **SIMPAN password ni di tempat selamat**,
   Tuan akan perlukan dia sekejap lagi
5. Pilih region paling dekat (cth: Singapore)
6. Tunggu 1-2 minit untuk Supabase siapkan projek

### 2.2 Dapatkan Connection String
1. Dalam projek Supabase tu, pergi ke **Project Settings** (ikon gear) >
   **Database**
2. Cari bahagian **Connection String**, pilih tab **URI** atau mod **ORM**
   > pilih **Prisma**
3. Salin connection string yang dipaparkan — nampak macam ni:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```
4. Ganti `[YOUR-PASSWORD]` dengan password yang Tuan simpan tadi (langkah 2.1)

---

## Bahagian 3: Buat fail `.env`

Fail `.env` ni tempat Tuan simpan semua "kunci rahsia" projek (password
database, dll) — ia berasingan daripada kod supaya senang & selamat diubah.

### 3.1 Cipta fail
1. Dalam folder `tanahmalaya`, cari fail `.env.example`
2. **Copy** fail tu (Ctrl+C), **Paste** dalam folder yang sama (Ctrl+V) —
   akan jadi `.env.example - Copy` atau `.env.example (2)`
3. **Rename** fail salinan tu kepada `.env` sahaja (padam semua yang lain,
   termasuk `.example`)

⚠️ **Penting**: Kalau guna Notepad untuk buat fail ni, pastikan bila "Save
As", pilih "Save as type: All Files" — kalau tidak, Notepad akan tambah
`.txt` di belakang tanpa Tuan sedar (jadi `.env.txt` yang Prisma tak boleh
baca).

### 3.2 Isi fail `.env`
Buka fail `.env` dengan Notepad (klik kanan > Open with > Notepad), dan isi
macam ni:

```
DATABASE_URL="postgresql://postgres.xxxx:PASSWORD@aws-0-xx.pooler.supabase.com:6543/postgres"

NEXT_PUBLIC_SITE_URL="http://localhost:3000"

BAYARCASH_API_TOKEN=""
BAYARCASH_PORTAL_KEY=""
BAYARCASH_SECRET_KEY=""

JWT_SECRET=""
```

- **DATABASE_URL** — tampal connection string dari Bahagian 2.2
- **NEXT_PUBLIC_SITE_URL** — biarkan `http://localhost:3000` buat masa ni
  (tukar ke `https://tanahmalaya.org` bila dah deploy sebenar nanti)
- **BAYARCASH_...** — boleh biarkan kosong buat masa ni, isi kemudian
  (Bahagian 6)
- **JWT_SECRET** — jana di langkah seterusnya

### 3.3 Jana JWT_SECRET
1. Dalam Terminal, taip:
   ```
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Salin rentetan panjang yang keluar
3. Tampal dalam `.env`, di antara tanda petik: `JWT_SECRET="rentetan-tadi"`
4. **Save** fail `.env`

---

## Bahagian 4: Cipta jadual database

Ini langkah yang cipta "ruang" dalam database Supabase untuk simpan data
ahli, kelas, produk, dll.

Dalam Terminal, taip:
```
npm run db:push
```

Tunggu sampai keluar mesej hijau macam
`Your database is now in sync with your Prisma schema`.

**Sahkan berjaya**: Log masuk semula ke Supabase > **Table Editor** — patut
nampak jadual macam `Member`, `LandClass`, `Activity`, `Product`, `Ad`,
`AdminUser`.

---

## Bahagian 5: Cipta akaun admin pertama

Ini akaun untuk Tuan log masuk ke dashboard (`/admin`) nanti.

Dalam Terminal, taip (tukar emel & password ikut suka Tuan):
```
node scripts/create-admin.js "admin@tanahmalaya.org" "kata-laluan-kuat-saya"
```

Patut keluar mesej: `Akaun admin sedia: admin@tanahmalaya.org`

**Simpan emel & password ni** — Tuan akan guna untuk log masuk dashboard.

---

## Bahagian 6: Jalankan website buat kali pertama

Dalam Terminal, taip:
```
npm run dev
```

Tunggu sampai keluar mesej macam `Ready in X ms`. Kemudian:

- Buka browser, pergi ke **http://localhost:3000** — ni laman awam
- Pergi ke **http://localhost:3000/admin** — log masuk dengan emel/password
  dari Bahagian 5

Website akan **kosong** buat masa ni (takde kelas/produk/Aktiviti lagi) —
tu normal, sebab database baru je siap dicipta. Tuan boleh tambah data
melalui dashboard admin.

**Untuk hentikan server** bila-bila masa: kembali ke Terminal, tekan
`Ctrl + C`.

**Untuk jalankan semula** lain kali: buka Terminal di folder `tanahmalaya`
dan taip `npm run dev` sahaja (tak perlu ulang langkah 1-5).

---

## Bahagian 7: BayarCash (buat lepas website dah jalan lancar)

1. Daftar di [bayarcash.com](https://bayarcash.com)
2. Dapatkan API Token, Portal Key, Secret Key dari portal Business > API
   Settings
3. Isi dalam `.env` (Bahagian 3.2), baris `BAYARCASH_...`
4. Restart server (`Ctrl+C`, then `npm run dev` semula)

---

## Panduan Selesaikan Masalah (Troubleshooting)

| Masalah | Punca Biasa | Penyelesaian |
|---|---|---|
| `Environment variable not found: DATABASE_URL` | Fail `.env` tak wujud/salah nama, atau kosong | Semak Bahagian 3 — pastikan nama fail tepat `.env` |
| `The table 'public.Ad' does not exist` | Belum run `db:push` lagi | Run Bahagian 4 |
| Laman ambil masa lama untuk load | Compile pertama kali (normal, 3-10 saat) ATAU projek Supabase "tidur" | Tunggu; kalau lebih 2 minit, semak status projek di Supabase (mesti "Active") |
| `npm install` gagal | Sambungan internet, atau Node.js versi lama | Semak `node -v` (perlu v18+) |
| Tak boleh log masuk `/admin` | Emel/password salah, atau belum run Bahagian 5 | Jalankan semula arahan `create-admin.js` |

---

## Kalau tersekat

Screenshot je mesej error dalam Terminal atau browser, hantar sini — saya
akan tunjuk punca dan cara betulkan, step-by-step.
