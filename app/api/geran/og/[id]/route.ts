export const dynamic = "force-dynamic";

// Gambar pratonton kongsi (og:image) dengan sempadan tanah DIBAKAR ke dalamnya.
//
// Di laman sendiri, polygon dilukis sebagai overlay SVG dan kekal boleh
// disunting. Tapi WhatsApp, Facebook dan Twitter cuma muat turun satu fail
// gambar - tiada HTML, tiada SVG, tiada JavaScript. Jadi untuk pratonton pautan
// sahaja kita rata-kan polygon ke dalam piksel di sini.
//
// Hanya penyenaraian DISAHKAN dilayan, dan satu-satunya gambar yang diambil
// ialah URL yang datang dari pangkalan data - id dalam URL tak pernah jadi
// sasaran fetch, jadi route ni tak boleh dijadikan proksi permintaan keluar.

import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { bacaGambarPolygons, titikKeCoverPx } from "@/lib/geran/polygon";

// Saiz pratonton pautan yang disyorkan Facebook/WhatsApp. Nisbah 1.91:1.
const LEBAR = 1200;
const TINGGI = 630;

function lukisanSvg(
  titik: Array<[number, number]>,
  label: string | null | undefined
): Buffer {
  const senarai = titik.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const tengahX = titik.reduce((j, p) => j + p[0], 0) / titik.length;
  const tengahY = titik.reduce((j, p) => j + p[1], 0) / titik.length;

  const teks = label
    ? `<text x="${tengahX.toFixed(1)}" y="${tengahY.toFixed(1)}" text-anchor="middle"
         dominant-baseline="middle" font-family="sans-serif" font-size="34" font-weight="700"
         fill="#FFFFFF" stroke="rgba(0,0,0,0.65)" stroke-width="6" paint-order="stroke"
      >${label.replace(/[<>&]/g, "")}</text>`
    : "";

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LEBAR}" height="${TINGGI}">
       <polygon points="${senarai}" fill="rgba(198,138,46,0.20)" stroke="#F4C55C"
                stroke-width="5" stroke-linejoin="round"/>
       ${teks}
     </svg>`
  );
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const geran = await prisma.geran.findUnique({ where: { id: params.id } });
  if (!geran || geran.status !== "DISAHKAN" || geran.hargaSiaranSen === null) {
    return new NextResponse("Not found", { status: 404 });
  }

  const polygons = bacaGambarPolygons(geran.gambarPolygons);
  // Pilih gambar pertama yang ADA sempadan dilukis, bukan semestinya gambar
  // pertama - kalau admin hanya melukis pada gambar kedua, itulah gambar yang
  // paling menerangkan penyenaraian ini.
  const url = geran.gambarUrls.find((u) => polygons[u]?.points?.length) ?? geran.gambarUrls[0];
  if (!url) return new NextResponse("Not found", { status: 404 });

  const bentuk = polygons[url];

  try {
    const jawapan = await fetch(url, { cache: "no-store" });
    if (!jawapan.ok) return new NextResponse("Upstream error", { status: 502 });
    const asal = Buffer.from(await jawapan.arrayBuffer());

    const asas = sharp(asal).resize(LEBAR, TINGGI, { fit: "cover", position: "centre" });

    let keluar = asas;
    if (bentuk?.points?.length && bentuk.w && bentuk.h) {
      // Tanpa dimensi asal kita tak tahu jalur mana yang dipangkas oleh
      // fit:"cover", jadi polygon akan tersasar. Lebih baik hantar gambar
      // bersih daripada gambar dengan sempadan di tempat yang salah.
      const titik = titikKeCoverPx(bentuk.points, bentuk.w, bentuk.h, LEBAR, TINGGI);
      keluar = asas.composite([{ input: lukisanSvg(titik, bentuk.label), top: 0, left: 0 }]);
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
