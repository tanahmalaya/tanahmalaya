# Peta kod — TanahMalaya (tanahmalaya.org)

Laman Pertubuhan Literasi Tanah (PLT): keahlian, kelas, aktiviti, merchandise,
sumbangan, aduan tanah, peta banjir/harga tanah.

**GERAN / gerantanah.com BUKAN lagi sebahagian repo ini.** Ia dipisahkan
sepenuhnya pada September 2026 ke repo `tanahmalayaku-cmd/gerantanah` (folder
tempatan `C:\Users\talha\projects\gerantanah`) dengan projek Vercel, database
Supabase dan stor Blob sendiri. Jangan tambah kod GERAN di sini. Satu-satunya
kaitan ialah poster promosi `components/PosterGerantanah.tsx` di halaman utama
yang memaut ke https://gerantanah.com.

## Struktur

```
app/(root routes)              - page.tsx, keahlian/, sumbangan/, merchandise/,
                                  aktiviti/, banjir/, harga-tanah/, kelas-tanah/,
                                  aduan-tanah/, wakaf/, borang-claim/, cart/, checkout/
app/admin/**                   - dashboard admin PLT
app/api/{members,orders,products,classes,activities,ads,sumbangan,
          wakaf,petty-cash,aduan-tanah,harga-tanah,banjir,paras-air,hotspot-banjir}/**
components/{aduan,ahli-plt,banjir,hargatanah,keahlian,peta,petty-cash,wakaf}/**
lib/{members,memberAuth,auth,bayarcash,easyparcel,email,receiptEmails,
      aduanTanah,wakafNegeri,promo,pricing,productSize,ic,postcode,csv}.ts
lib/{prisma,settings,seo}.ts
scripts/create-admin.js, backfill-*.js, import-napic-harga-tanah.js
```

## Pemisahan GERAN - selesai

Model & jadual GERAN dibuang dari skema dan database (Fasa 4b, `prisma/sql/2026-09-buang-geran.sql`,
dijalankan sebelum `db push`). Fail blob `geran/*` dibuang dari stor utama (`scripts/buang-blob-geran.js`).
Backup data & fail: `C:/Users/talha/projects/backups/`.
