# Peta kod — TanahMalaya vs GeranTanah

Satu repo Next.js, satu deployment, satu database — tapi dua produk dengan domain
berasingan:

- **tanahmalaya.org** — laman Pertubuhan Literasi Tanah (PLT): keahlian, kelas,
  aktiviti, merchandise, sumbangan, aduan tanah, peta banjir/harga tanah.
- **gerantanah.com** — marketplace penyenaraian tanah ("GERAN"). `middleware.ts`
  kesan hostname ni (`lib/geran/domain.ts`) dan rewrite semua path ke `/geran/*`.

Bila cari/tambah kod, guna peta ni untuk tahu ia kepunyaan produk mana.

## Fail khusus GeranTanah

```
app/geran/**                 - laman awam & admin GERAN (App Router)
app/api/geran/**              - API awam GERAN (upload, og image)
app/api/geran-admin/**        - API admin GERAN (login, create/update listing)
components/geran/**           - semua komponen UI GERAN (termasuk components/geran/polygon/)
lib/geran/**                  - logik & helper GERAN sahaja:
  index.ts                      label/konstanta dropdown, had muat naik, format
  admin-auth.ts                 sesi JWT admin GERAN (cookie berasingan dari admin PLT)
  domain.ts                     senarai hostname gerantanah.com
  is-request.ts                 kesan request domain GERAN dalam Server Component
  polygon.ts                    bentuk data & matematik polygon sempadan tanah
  parse.ts                      penghurai iklan WhatsApp/Telegram -> medan borang
scripts/create-geran-admin.js
scripts/generate-geran-favicons.js
public/geran-*, public/Geran_logo.jpeg, public/hero-geran.jpg
```

Model Prisma GERAN dikumpul dalam satu blok di `prisma/schema.prisma` — cari
komen `MARKETPLACE GERAN TANAH` (`Seller`, `Geran`, `GeranFavorite`,
`PendaftaranTertunda`, enum `StatusGeran`/`SumberGeran`). `GeranAdminUser`
letak dekat `AdminUser` di atas sekali kerana ia infra login, bukan data
penyenaraian.

## Fail khusus TanahMalaya (laman PLT)

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
scripts/create-admin.js, backfill-*.js, import-napic-harga-tanah.js
```

## Infra dikongsi (jangan letak dalam mana-mana folder produk)

```
lib/prisma.ts, lib/settings.ts, lib/seo.ts, lib/turnstile.ts   - dipakai kedua-dua produk
middleware.ts, app/layout.tsx, app/sitemap.ts, app/robots.ts    - routing domain
components/{Header,Footer,ConditionalChrome,...}.tsx            - chrome yang cabang
                                                                    ikut isGeranDomainRequest()
prisma/schema.prisma                                             - satu DB untuk kedua-dua
```

`components/ConditionalChrome.tsx` dan `app/layout.tsx` guna
`isGeranDomainRequest()` (`lib/geran/is-request.ts`) untuk pilih header/footer
mana nak papar — ini punca utama kenapa dua produk berkongsi root layout yang
sama walaupun kelihatan berasingan di browser.

## Konvensyen

- Import guna alias `@/lib/geran/...`, bukan path relatif — `@/lib/geran`
  (tanpa suffix) resolve ke `lib/geran/index.ts`.
- Fail/komponen baru untuk GERAN masuk `lib/geran/`, `components/geran/`, atau
  `app/geran/...` — jangan letak flat dalam `lib/` root macam dulu.
