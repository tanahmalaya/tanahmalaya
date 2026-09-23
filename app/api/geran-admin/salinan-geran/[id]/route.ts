export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { get } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import { TOKEN_BLOB_PERIBADI } from "@/lib/geran/blob-peribadi";

// Proksi untuk salinan penuh geran. Fail itu blob PERIBADI - URL mentahnya
// tak pernah sampai ke pelayar, jadi ia tak boleh dikongsi keluar walaupun
// tak sengaja. Setiap permintaan disemak terhadap sesi admin GERAN dulu.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const geran = await prisma.geran.findUnique({
    where: { id: params.id },
    select: { seq: true, salinanGeranUrl: true },
  });
  if (!geran?.salinanGeranUrl) {
    return NextResponse.json({ error: "Tiada salinan geran untuk penyenaraian ini" }, { status: 404 });
  }

  const hasil = await get(geran.salinanGeranUrl, { access: "private", token: TOKEN_BLOB_PERIBADI }).catch(() => null);
  if (!hasil || hasil.statusCode !== 200) {
    return NextResponse.json({ error: "Fail tak dapat dibaca dari storan" }, { status: 502 });
  }

  return new NextResponse(hasil.stream, {
    headers: {
      "Content-Type": hasil.blob.contentType || "application/pdf",
      "Content-Disposition": `inline; filename="salinan-geran-${geran.seq}.pdf"`,
      // Jangan simpan dalam mana-mana cache perantara - ia dokumen peribadi.
      "Cache-Control": "private, no-store",
    },
  });
}
