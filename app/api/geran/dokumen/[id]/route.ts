export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import { getSellerSession } from "@/lib/sellerAuth";
import { STATUS_BUTIRAN_AWAM } from "@/lib/geran/status";
import { TOKEN_BLOB_PERIBADI } from "@/lib/geran/blob-peribadi";

// Proksi Document Vault. Fail ialah blob PERIBADI - URL mentahnya tak pernah
// sampai ke pelayar. Setiap permintaan disemak ikut tahap akses dokumen:
//   PUBLIC     - sesiapa, tapi hanya bila penyenaraian tersiar awam
//   BUYER      - pengguna GERAN yang log masuk, penyenaraian tersiar awam
//   CONSULTANT - admin sahaja buat masa ni (tiada akaun konsultan lagi)
//   ADMIN      - admin sahaja
// Admin sentiasa dibenarkan, termasuk untuk draf.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const dok = await prisma.dokumen.findUnique({
    where: { id: params.id },
    select: { nama: true, url: true, mime: true, akses: true, geran: { select: { status: true } } },
  });
  // 404 (bukan 403) untuk semua penolakan supaya id dokumen tak boleh diteka
  // wujud atau tidak.
  const tiada = () => NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!dok) return tiada();

  const admin = !!getGeranAdminSession();
  const awam = STATUS_BUTIRAN_AWAM.includes(dok.geran.status);
  const dibenarkan =
    admin ||
    (awam && dok.akses === "PUBLIC") ||
    (awam && dok.akses === "BUYER" && !!getSellerSession());
  if (!dibenarkan) return tiada();

  // get() melontar (bukan pulang null) bila stor tak dapat dicapai atau token
  // peribadi belum ditetapkan - tukar kepada 502 yang kemas.
  const hasil = await get(dok.url, { access: "private", token: TOKEN_BLOB_PERIBADI }).catch(() => null);
  if (!hasil || hasil.statusCode !== 200) {
    return NextResponse.json({ error: "File could not be read from storage" }, { status: 502 });
  }

  const namaSelamat = dok.nama.replace(/[^\w.\- ]+/g, "_").slice(0, 120) || "document";
  return new NextResponse(hasil.stream, {
    headers: {
      "Content-Type": hasil.blob.contentType || dok.mime,
      "Content-Disposition": `inline; filename="${namaSelamat}"`,
      // Dokumen peribadi - jangan simpan dalam cache perantara.
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
