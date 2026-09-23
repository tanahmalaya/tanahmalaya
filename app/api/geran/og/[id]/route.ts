export const dynamic = "force-dynamic";

// Gambar pratonton kongsi (og:image) dengan sempadan tanah DIBAKAR ke dalamnya.
//
// Di laman sendiri, polygon dilukis sebagai overlay SVG dan kekal boleh
// disunting. Tapi WhatsApp, Facebook dan Twitter cuma muat turun satu fail
// gambar - tiada HTML, tiada SVG, tiada JavaScript. Jadi untuk pratonton pautan
// sahaja kita rata-kan polygon ke dalam piksel di sini.
//
// Hanya penyenaraian yang tersiar awam dilayan, dan satu-satunya gambar yang diambil
// ialah URL yang datang dari pangkalan data - id dalam URL tak pernah jadi
// sasaran fetch, jadi route ni tak boleh dijadikan proksi permintaan keluar.

import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { STATUS_BUTIRAN_AWAM } from "@/lib/geran/status";
import { titikKeCoverPx } from "@/lib/geran/polygon";
import { penandaAwam } from "@/lib/geran/penanda";
import { formatRM } from "@/lib/geran";

// Saiz pratonton pautan yang disyorkan Facebook/WhatsApp. Nisbah 1.91:1.
const LEBAR = 1200;
const TINGGI = 630;

function lukisanSvg(lots: Array<{ titik: Array<[number, number]>; label: string | null; warna: string }>): Buffer {
  const bentuk = lots
    .map(({ titik, label, warna }) => {
      const senarai = titik.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
      const tengahX = titik.reduce((j, p) => j + p[0], 0) / titik.length;
      const tengahY = titik.reduce((j, p) => j + p[1], 0) / titik.length;
      const teks = label
        ? `<text x="${tengahX.toFixed(1)}" y="${tengahY.toFixed(1)}" text-anchor="middle"
             dominant-baseline="middle" font-family="sans-serif" font-size="34" font-weight="700"
             fill="#FFFFFF" stroke="rgba(0,0,0,0.65)" stroke-width="6" paint-order="stroke"
          >${label.replace(/[<>&]/g, "")}</text>`
        : "";
      return `<polygon points="${senarai}" fill="${warna}" fill-opacity="0.25" stroke="${warna}"
                stroke-width="5" stroke-linejoin="round"/>${teks}`;
    })
    .join("\n");

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${LEBAR}" height="${TINGGI}">${bentuk}</svg>`);
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({ where: { id: params.id }, include: { lots: true } });
  if (!geran || !STATUS_BUTIRAN_AWAM.includes(geran.status) || geran.hargaSiaranSen === null) {
    return new NextResponse("Not found", { status: 404 });
  }

  const penanda = penandaAwam(geran, geran.lots, formatRM);
  const lotPada = (u: string) => penanda[u]?.ciri.filter((c) => c.bentuk === "poligon") ?? [];
  // Pilih gambar pertama yang ADA sempadan dilukis, bukan semestinya gambar
  // pertama - kalau admin hanya melukis pada gambar kedua, itulah gambar yang
  // paling menerangkan penyenaraian ini.
  const url = geran.gambarUrls.find((u) => lotPada(u).length > 0) ?? geran.gambarUrls[0];
  if (!url) return new NextResponse("Not found", { status: 404 });

  const entri = penanda[url];
  const lotGambar = lotPada(url);

  try {
    const jawapan = await fetch(url, { cache: "no-store" });
    if (!jawapan.ok) return new NextResponse("Upstream error", { status: 502 });
    const asal = Buffer.from(await jawapan.arrayBuffer());

    const asas = sharp(asal).resize(LEBAR, TINGGI, { fit: "cover", position: "centre" });

    let keluar = asas;
    if (entri && lotGambar.length > 0) {
      const lots = lotGambar.map((c) => ({
        titik: titikKeCoverPx(c.points, entri.w, entri.h, LEBAR, TINGGI),
        label: c.label,
        warna: c.warna,
      }));
      keluar = asas.composite([{ input: lukisanSvg(lots), top: 0, left: 0 }]);
    }

    const jpeg = await keluar.jpeg({ quality: 82, mozjpeg: true }).toBuffer();

    return new NextResponse(jpeg, {
      headers: {
        "Content-Type": "image/jpeg",
        // Pengikis WhatsApp/FB menyimpan hasilnya sendiri berhari-hari, jadi
        // cache tepi yang panjang di sini hampir tak menjejaskan kesegaran -
        // tapi ia menghalang setiap perkongsian daripada menarik semula gambar
        // asal dari Blob (yang dicaj mengikut data transfer).
        "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("Render error", { status: 500 });
  }
}
