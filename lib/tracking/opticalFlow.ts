// Optical flow Lucas-Kanade berpiramid, ditulis tulen dalam TypeScript supaya
// editor video admin tak perlu memuatkan OpenCV.js (~9MB wasm) untuk satu
// kegunaan sahaja.
//
// Ia dipakai oleh components/geran/polygon/VideoPolygonEditor: setiap langkah
// masa, kita jejak sekumpulan titik ciri DI DALAM polygon dari bingkai lepas ke
// bingkai sekarang, anggar satu transform yang paling padan dengan pergerakan
// mereka, lalu kenakan transform itu pada bucu polygon. Untuk video drone atas
// tanah rata pendekatan ni berkesan: pan, orbit dan zoom semuanya hampir-affin.
//
// Semua fungsi di sini bekerja dalam PIKSEL pada resolusi kerja (lihat
// LEBAR_KERJA_MAKS) - penukaran ke koordinat ternormal dibuat oleh pemanggil.

export const LEBAR_KERJA_MAKS = 640;

export type ImejGray = {
  data: Float32Array;
  lebar: number;
  tinggi: number;
};

export type TitikPx = { x: number; y: number };

type Aras = {
  imej: ImejGray;
  gx: Float32Array;
  gy: Float32Array;
};

export type Piramid = Aras[];

// Transform affin [a, b, c, d, e, f]: xBaru = a*x + b*y + c, yBaru = d*x + e*y + f
export type Affin = [number, number, number, number, number, number];

export const AFFIN_IDENTITI: Affin = [1, 0, 0, 0, 1, 0];

// Bilangan aras menentukan anjakan maksimum yang boleh dijejak. Setiap aras
// membahagi dua anjakan yang perlu diselesaikan LK, dan LK hanya boleh dipercayai
// bila anjakan pada aras itu lebih kecil daripada kala tekstur setempat - kalau
// tidak ia mengunci pada puncak yang salah (rumput, atap, bendang bertanam
// berbaris semuanya hampir berkala). Empat aras tak mencukupi: pada video 640px
// ia mula gagal sekitar 15px sebingkai, iaitu panning drone yang biasa.
const ARAS_PIRAMID = 6;
const LEBAR_ARAS_MIN = 36;
const TINGGI_ARAS_MIN = 20;
const JEJARI_TETINGKAP = 6; // tetingkap 13x13 pada aras penuh
const ITERASI_MAKS = 12;

// ---------- Penukaran imej ----------

export function imageDataKeGray(imageData: ImageData): ImejGray {
  const { width, height, data } = imageData;
  const keluar = new Float32Array(width * height);
  for (let i = 0, j = 0; i < keluar.length; i += 1, j += 4) {
    // Pemberat luminans Rec. 601 - lebih dekat dengan cara mata melihat
    // kontras, jadi pengesan bucu tak tertarik pada perubahan warna semata.
    keluar[i] = 0.299 * data[j] + 0.587 * data[j + 1] + 0.114 * data[j + 2];
  }
  return { data: keluar, lebar: width, tinggi: height };
}

function kaburDanTurunSkala(img: ImejGray): ImejGray {
  const { data, lebar, tinggi } = img;
  const lebarBaru = Math.max(1, lebar >> 1);
  const tinggiBaru = Math.max(1, tinggi >> 1);

  // Penapis binomial 5-tap [1 4 6 4 1]/16 - penghampiran Gaussian yang sama
  // dipakai pyrDown OpenCV. Purata 2x2 yang lebih murah TAK memadai: butiran
  // halus (rumput, jaringan pagar, hingar sensor) beralias jadi corak palsu
  // pada aras kasar, dan aras kasar itulah yang menanggung anjakan besar. Tanpa
  // penapis ini, jejak gagal sebaik kamera bergerak lebih ~15px sebingkai.
  const mendatar = new Float32Array(lebar * tinggi);
  for (let y = 0; y < tinggi; y += 1) {
    const baris = y * lebar;
    for (let x = 0; x < lebar; x += 1) {
      const x0 = Math.max(0, x - 2);
      const x1 = Math.max(0, x - 1);
      const x3 = Math.min(lebar - 1, x + 1);
      const x4 = Math.min(lebar - 1, x + 2);
      mendatar[baris + x] =
        (data[baris + x0] + 4 * data[baris + x1] + 6 * data[baris + x] + 4 * data[baris + x3] + data[baris + x4]) /
        16;
    }
  }

  const keluar = new Float32Array(lebarBaru * tinggiBaru);
  for (let y = 0; y < tinggiBaru; y += 1) {
    const sy = y * 2;
    const y0 = Math.max(0, sy - 2) * lebar;
    const y1 = Math.max(0, sy - 1) * lebar;
    const y2 = sy * lebar;
    const y3 = Math.min(tinggi - 1, sy + 1) * lebar;
    const y4 = Math.min(tinggi - 1, sy + 2) * lebar;
    for (let x = 0; x < lebarBaru; x += 1) {
      const sx = Math.min(lebar - 1, x * 2);
      keluar[y * lebarBaru + x] =
        (mendatar[y0 + sx] + 4 * mendatar[y1 + sx] + 6 * mendatar[y2 + sx] + 4 * mendatar[y3 + sx] + mendatar[y4 + sx]) /
        16;
    }
  }
  return { data: keluar, lebar: lebarBaru, tinggi: tinggiBaru };
}

function kiraGradien(img: ImejGray): { gx: Float32Array; gy: Float32Array } {
  const { data, lebar, tinggi } = img;
  const gx = new Float32Array(data.length);
  const gy = new Float32Array(data.length);
  for (let y = 0; y < tinggi; y += 1) {
    for (let x = 0; x < lebar; x += 1) {
      const i = y * lebar + x;
      const kiri = data[y * lebar + Math.max(0, x - 1)];
      const kanan = data[y * lebar + Math.min(lebar - 1, x + 1)];
      const atas = data[Math.max(0, y - 1) * lebar + x];
      const bawah = data[Math.min(tinggi - 1, y + 1) * lebar + x];
      gx[i] = (kanan - kiri) * 0.5;
      gy[i] = (bawah - atas) * 0.5;
    }
  }
  return { gx, gy };
}

export function binaPiramid(img: ImejGray, aras = ARAS_PIRAMID): Piramid {
  const senarai: Piramid = [];
  let semasa = img;
  for (let i = 0; i < aras; i += 1) {
    const { gx, gy } = kiraGradien(semasa);
    senarai.push({ imej: semasa, gx, gy });

    // Berhenti SEBELUM mencipta aras yang lebih kecil daripada saiz minimum,
    // bukan selepas. Aras yang terlalu kecil bukan sekadar membazir - hampir
    // semua strukturnya hilang, jadi LK di situ memulangkan anjakan rawak yang
    // kemudian dibawa turun sebagai "tekaan" ke setiap aras yang lebih halus.
    if ((semasa.lebar >> 1) < LEBAR_ARAS_MIN || (semasa.tinggi >> 1) < TINGGI_ARAS_MIN) break;
    semasa = kaburDanTurunSkala(semasa);
  }
  return senarai;
}

// ---------- Persampelan ----------

function sampelBilinear(data: Float32Array, lebar: number, tinggi: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const xa = Math.min(lebar - 1, Math.max(0, x0));
  const xb = Math.min(lebar - 1, Math.max(0, x0 + 1));
  const ya = Math.min(tinggi - 1, Math.max(0, y0));
  const yb = Math.min(tinggi - 1, Math.max(0, y0 + 1));
  const p00 = data[ya * lebar + xa];
  const p10 = data[ya * lebar + xb];
  const p01 = data[yb * lebar + xa];
  const p11 = data[yb * lebar + xb];
  return p00 * (1 - fx) * (1 - fy) + p10 * fx * (1 - fy) + p01 * (1 - fx) * fy + p11 * fx * fy;
}

// ---------- Pengesan bucu Shi-Tomasi ----------

export function titikDalamPolygon(titik: TitikPx, polygon: TitikPx[]): boolean {
  let dalam = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const a = polygon[i];
    const b = polygon[j];
    const bersilang = a.y > titik.y !== b.y > titik.y;
    if (bersilang && titik.x < ((b.x - a.x) * (titik.y - a.y)) / (b.y - a.y) + a.x) {
      dalam = !dalam;
    }
  }
  return dalam;
}

function kotakSempadan(polygon: TitikPx[], lebar: number, tinggi: number) {
  let minX = Infinity;
  let minY = Infinity;
  let maksX = -Infinity;
  let maksY = -Infinity;
  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maksX = Math.max(maksX, p.x);
    maksY = Math.max(maksY, p.y);
  }
  return {
    minX: Math.max(JEJARI_TETINGKAP + 1, Math.floor(minX)),
    minY: Math.max(JEJARI_TETINGKAP + 1, Math.floor(minY)),
    maksX: Math.min(lebar - JEJARI_TETINGKAP - 2, Math.ceil(maksX)),
    maksY: Math.min(tinggi - JEJARI_TETINGKAP - 2, Math.ceil(maksY)),
  };
}

// Cari titik ciri yang "boleh dijejak" (bucu, bukan tepi lurus atau kawasan
// rata) DI DALAM polygon. Tanah lapang kadang-kadang terlalu seragam; bila
// ciri terlalu sedikit, pemanggil patut beritahu admin supaya jejak manual.
export function kesanCiri(img: ImejGray, polygon: TitikPx[], maksCiri = 220): TitikPx[] {
  const { data, lebar, tinggi } = img;
  const { minX, minY, maksX, maksY } = kotakSempadan(polygon, lebar, tinggi);
  if (maksX <= minX || maksY <= minY) return [];

  const jejariWin = 3;
  const calon: Array<{ x: number; y: number; skor: number }> = [];
  let skorTerbaik = 0;

  for (let y = minY; y <= maksY; y += 2) {
    for (let x = minX; x <= maksX; x += 2) {
      if (!titikDalamPolygon({ x, y }, polygon)) continue;

      let sxx = 0;
      let syy = 0;
      let sxy = 0;
      for (let dy = -jejariWin; dy <= jejariWin; dy += 1) {
        for (let dx = -jejariWin; dx <= jejariWin; dx += 1) {
          const i = (y + dy) * lebar + (x + dx);
          const ix = (data[i + 1] - data[i - 1]) * 0.5;
          const iy = (data[i + lebar] - data[i - lebar]) * 0.5;
          sxx += ix * ix;
          syy += iy * iy;
          sxy += ix * iy;
        }
      }

      // Nilai eigen terkecil bagi matriks struktur - besar hanya bila
      // kecerunan kuat pada KEDUA-DUA arah, iaitu bucu sebenar.
      const jumlah = sxx + syy;
      const beza = Math.sqrt((sxx - syy) * (sxx - syy) + 4 * sxy * sxy);
      const skor = (jumlah - beza) / 2;
      if (skor > 1) {
        calon.push({ x, y, skor });
        if (skor > skorTerbaik) skorTerbaik = skor;
      }
    }
  }

  const ambang = skorTerbaik * 0.01;
  const disaring = calon.filter((c) => c.skor >= ambang).sort((a, b) => b.skor - a.skor);

  // Sebaran minimum supaya ciri tak berhimpun pada satu bucu pagar sahaja -
  // anggaran transform perlukan titik yang merentas seluruh polygon.
  const jarakMin = Math.max(6, Math.round(Math.min(maksX - minX, maksY - minY) / 18));
  const jarakMinKuasaDua = jarakMin * jarakMin;

  // Kuota setiap sel. Memilih bucu terkuat secara global sahaja tidak selamat:
  // satu objek berkontras tinggi dalam polygon (bumbung zink, timbunan batu,
  // kereta) boleh menghasilkan skor yang jauh mengatasi tanah di sekelilingnya
  // dan meragut hampir seluruh kuota. Bila objek itu bergerak sendiri atau
  // melindungi tanah, jejak akan mengikutnya, bukan mengikut tanah. Grid ini
  // memaksa ciri tersebar ke seluruh polygon supaya mana-mana satu objek
  // sentiasa kekal minoriti.
  const KOLUM = 8;
  const BARIS = 6;
  const lebarSel = Math.max(1, (maksX - minX) / KOLUM);
  const tinggiSel = Math.max(1, (maksY - minY) / BARIS);
  const kuotaSel = Math.max(2, Math.ceil(maksCiri / (KOLUM * BARIS)));
  const kiraanSel = new Map<number, number>();

  const dipilih: TitikPx[] = [];
  const bolehTambah = (c: { x: number; y: number }) => {
    for (const p of dipilih) {
      const dx = p.x - c.x;
      const dy = p.y - c.y;
      if (dx * dx + dy * dy < jarakMinKuasaDua) return false;
    }
    return true;
  };

  for (const c of disaring) {
    if (dipilih.length >= maksCiri) break;
    const sel =
      Math.min(BARIS - 1, Math.floor((c.y - minY) / tinggiSel)) * KOLUM +
      Math.min(KOLUM - 1, Math.floor((c.x - minX) / lebarSel));
    if ((kiraanSel.get(sel) ?? 0) >= kuotaSel) continue;
    if (!bolehTambah(c)) continue;
    kiraanSel.set(sel, (kiraanSel.get(sel) ?? 0) + 1);
    dipilih.push({ x: c.x, y: c.y });
  }

  // Pusingan kedua tanpa kuota - sel kosong (langit, air, tanah rata tanpa
  // tekstur) bermakna pusingan pertama tak guna habis bajet ciri.
  if (dipilih.length < maksCiri) {
    for (const c of disaring) {
      if (dipilih.length >= maksCiri) break;
      if (bolehTambah(c)) dipilih.push({ x: c.x, y: c.y });
    }
  }

  return dipilih;
}

// ---------- Lucas-Kanade berpiramid ----------

export type HasilJejak = { titik: TitikPx; ok: boolean };

export function jejakTitik(dari: Piramid, ke: Piramid, titik: TitikPx[]): HasilJejak[] {
  const arasTertinggi = Math.min(dari.length, ke.length) - 1;

  return titik.map((p) => {
    let gx = 0;
    let gy = 0;
    let gagal = false;

    for (let L = arasTertinggi; L >= 0; L -= 1) {
      const skala = 1 / (1 << L);
      const a = dari[L];
      const b = ke[L];
      const { lebar, tinggi } = a.imej;
      const px = p.x * skala;
      const py = p.y * skala;

      // Tetingkap mengecil pada aras kasar. Tetingkap 13x13 atas imej 40x22
      // akan menolak hampir semua titik kerana tepinya, sedangkan aras kasar
      // itulah yang paling kita perlukan untuk menampung anjakan besar.
      const jejari = Math.max(2, Math.min(JEJARI_TETINGKAP, Math.floor(Math.min(lebar, tinggi) / 5)));

      if (px < jejari || py < jejari || px >= lebar - jejari || py >= tinggi - jejari) {
        // Di luar kawasan sah pada aras INI sahaja. Melangkau aras itu cuma
        // kehilangan penghalusan; menggugurkan titik terus akan membuang bucu
        // yang sebenarnya masih boleh dijejak pada aras yang lebih halus.
        if (L === 0) {
          gagal = true;
          break;
        }
        gx *= 2;
        gy *= 2;
        continue;
      }

      // Matriks struktur G dikira sekali sahaja untuk aras ini - ia bergantung
      // pada bingkai SUMBER sahaja, jadi mengulanginya setiap iterasi membazir.
      let sxx = 0;
      let syy = 0;
      let sxy = 0;
      const sampelIx: number[] = [];
      const sampelIy: number[] = [];
      const sampelI: number[] = [];
      for (let dy = -jejari; dy <= jejari; dy += 1) {
        for (let dx = -jejari; dx <= jejari; dx += 1) {
          const ix = sampelBilinear(a.gx, lebar, tinggi, px + dx, py + dy);
          const iy = sampelBilinear(a.gy, lebar, tinggi, px + dx, py + dy);
          sampelIx.push(ix);
          sampelIy.push(iy);
          sampelI.push(sampelBilinear(a.imej.data, lebar, tinggi, px + dx, py + dy));
          sxx += ix * ix;
          syy += iy * iy;
          sxy += ix * iy;
        }
      }

      const det = sxx * syy - sxy * sxy;
      if (det < 1e-4 || sxx + syy < 1) {
        // Kawasan terlalu rata atau tepi lurus (masalah bukaan) - anjakan tak
        // dapat ditentukan di sini. Kekalkan tekaan dari aras yang lebih kasar.
        if (L > 0) {
          gx *= 2;
          gy *= 2;
        }
        continue;
      }

      let vx = 0;
      let vy = 0;
      for (let iter = 0; iter < ITERASI_MAKS; iter += 1) {
        const qx = px + gx + vx;
        const qy = py + gy + vy;
        if (qx < 0 || qy < 0 || qx >= lebar || qy >= tinggi) {
          gagal = true;
          break;
        }

        let bx = 0;
        let by = 0;
        let k = 0;
        for (let dy = -jejari; dy <= jejari; dy += 1) {
          for (let dx = -jejari; dx <= jejari; dx += 1, k += 1) {
            const beza = sampelI[k] - sampelBilinear(b.imej.data, lebar, tinggi, qx + dx, qy + dy);
            bx += beza * sampelIx[k];
            by += beza * sampelIy[k];
          }
        }

        const dvx = (syy * bx - sxy * by) / det;
        const dvy = (sxx * by - sxy * bx) / det;
        vx += dvx;
        vy += dvy;
        if (Math.abs(dvx) < 0.01 && Math.abs(dvy) < 0.01) break;
      }

      if (gagal) break;
      gx += vx;
      gy += vy;
      if (L > 0) {
        gx *= 2;
        gy *= 2;
      }
    }

    if (gagal || !Number.isFinite(gx) || !Number.isFinite(gy)) {
      return { titik: p, ok: false };
    }
    return { titik: { x: p.x + gx, y: p.y + gy }, ok: true };
  });
}

// Jejak ke hadapan, kemudian jejak hasilnya BALIK ke bingkai asal. Titik yang
// jujur akan pulang ke tempat asalnya; titik yang terlindung (kereta melintas,
// bayang awan) atau tersangkut pada tekstur berulang tidak. Ujian mudah ni
// membuang jenis ralat yang paling merosakkan - padanan yang nampak yakin tapi
// salah, yang boleh lepas saringan outlier kerana ia konsisten antara satu sama
// lain.
export function jejakTitikDuaHala(
  dari: Piramid,
  ke: Piramid,
  titik: TitikPx[],
  ambangPulang = 1
): HasilJejak[] {
  const hadapan = jejakTitik(dari, ke, titik);
  const hidup = hadapan.filter((h) => h.ok).map((h) => h.titik);
  if (hidup.length === 0) return hadapan;

  const belakang = jejakTitik(ke, dari, hidup);
  const ambangKuasaDua = ambangPulang * ambangPulang;

  let j = 0;
  return hadapan.map((h, i) => {
    if (!h.ok) return h;
    const pulang = belakang[j];
    j += 1;
    if (!pulang.ok) return { titik: h.titik, ok: false };
    const dx = pulang.titik.x - titik[i].x;
    const dy = pulang.titik.y - titik[i].y;
    return { titik: h.titik, ok: dx * dx + dy * dy <= ambangKuasaDua };
  });
}

// ---------- Anggaran transform ----------

function selesai3x3(m: number[][], b: number[]): number[] | null {
  const a = m.map((baris, i) => [...baris, b[i]]);
  for (let i = 0; i < 3; i += 1) {
    let pangsi = i;
    for (let j = i + 1; j < 3; j += 1) {
      if (Math.abs(a[j][i]) > Math.abs(a[pangsi][i])) pangsi = j;
    }
    if (Math.abs(a[pangsi][i]) < 1e-9) return null;
    const simpan = a[i];
    a[i] = a[pangsi];
    a[pangsi] = simpan;
    for (let j = i + 1; j < 3; j += 1) {
      const f = a[j][i] / a[i][i];
      for (let k = i; k < 4; k += 1) a[j][k] -= f * a[i][k];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i -= 1) {
    let jumlah = a[i][3];
    for (let k = i + 1; k < 3; k += 1) jumlah -= a[i][k] * x[k];
    x[i] = jumlah / a[i][i];
  }
  return x;
}

function affinDariPasangan(dari: TitikPx[], ke: TitikPx[]): Affin | null {
  const n = dari.length;
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sxu = 0;
  let syu = 0;
  let su = 0;
  let sxv = 0;
  let syv = 0;
  let sv = 0;
  for (let i = 0; i < n; i += 1) {
    const x = dari[i].x;
    const y = dari[i].y;
    const u = ke[i].x;
    const v = ke[i].y;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
    sxu += x * u;
    syu += y * u;
    su += u;
    sxv += x * v;
    syv += y * v;
    sv += v;
  }
  const m = [
    [sxx, sxy, sx],
    [sxy, syy, sy],
    [sx, sy, n],
  ];
  const baris1 = selesai3x3(m, [sxu, syu, su]);
  const baris2 = selesai3x3(m, [sxv, syv, sv]);
  if (!baris1 || !baris2) return null;
  return [baris1[0], baris1[1], baris1[2], baris2[0], baris2[1], baris2[2]];
}

function keserupaanDariPasangan(dari: TitikPx[], ke: TitikPx[]): Affin | null {
  const n = dari.length;
  if (n < 2) return null;
  let mx = 0;
  let my = 0;
  let mu = 0;
  let mv = 0;
  for (let i = 0; i < n; i += 1) {
    mx += dari[i].x;
    my += dari[i].y;
    mu += ke[i].x;
    mv += ke[i].y;
  }
  mx /= n;
  my /= n;
  mu /= n;
  mv /= n;

  let atasA = 0;
  let atasB = 0;
  let bawah = 0;
  for (let i = 0; i < n; i += 1) {
    const x = dari[i].x - mx;
    const y = dari[i].y - my;
    const u = ke[i].x - mu;
    const v = ke[i].y - mv;
    atasA += x * u + y * v;
    atasB += x * v - y * u;
    bawah += x * x + y * y;
  }
  if (bawah < 1e-6) return null;
  const a = atasA / bawah;
  const b = atasB / bawah;
  return [a, -b, mu - a * mx + b * my, b, a, mv - b * mx - a * my];
}

export function gunaAffin(m: Affin, p: TitikPx): TitikPx {
  return { x: m[0] * p.x + m[1] * p.y + m[2], y: m[3] * p.x + m[4] * p.y + m[5] };
}

// Cari transform yang paling menerangkan pergerakan titik. Titik yang tersasar
// (jejak melekat pada awan, burung, atau tekstur berulang) dibuang secara
// berperingkat - tanpa ini satu titik rosak boleh menarik seluruh polygon.
export function anggarTransform(
  dari: TitikPx[],
  ke: TitikPx[]
): { matriks: Affin; bilanganInlier: number; ralatMedian: number } | null {
  if (dari.length < 2) return null;

  let indeks = dari.map((_, i) => i);
  let matriks: Affin | null = null;
  let ralatMedian = 0;

  for (let pusingan = 0; pusingan < 4; pusingan += 1) {
    const subDari = indeks.map((i) => dari[i]);
    const subKe = indeks.map((i) => ke[i]);
    // Affin penuh (6 darjah kebebasan) perlukan lebih banyak titik untuk stabil.
    // Dengan sampel kecil ia mula "menjelaskan" hingar sebagai ricih, jadi kita
    // turun ke keserupaan (skala + putaran + anjakan) yang lebih ketat.
    matriks =
      subDari.length >= 8 ? affinDariPasangan(subDari, subKe) : keserupaanDariPasangan(subDari, subKe);
    if (!matriks) matriks = keserupaanDariPasangan(subDari, subKe);
    if (!matriks) return null;

    const siap = matriks;
    const ralat = indeks.map((i) => {
      const teka = gunaAffin(siap, dari[i]);
      return Math.hypot(teka.x - ke[i].x, teka.y - ke[i].y);
    });
    const diisih = [...ralat].sort((a, b) => a - b);
    ralatMedian = diisih[Math.floor(diisih.length / 2)] ?? 0;

    const ambang = Math.max(1.5, ralatMedian * 2.5);
    const baru = indeks.filter((_, k) => ralat[k] <= ambang);
    if (baru.length < 3 || baru.length === indeks.length) break;
    indeks = baru;
  }

  if (!matriks) return null;

  // Transform yang meletup (skala/putaran melampau antara dua bingkai
  // bersebelahan) hampir pasti hasil padanan palsu, bukan gerakan drone.
  const skala = Math.sqrt(Math.abs(matriks[0] * matriks[4] - matriks[1] * matriks[3]));
  if (!Number.isFinite(skala) || skala < 0.6 || skala > 1.6) return null;

  return { matriks, bilanganInlier: indeks.length, ralatMedian };
}
