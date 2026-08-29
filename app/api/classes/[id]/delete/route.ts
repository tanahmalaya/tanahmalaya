export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  try {
    await prisma.landClass.delete({ where: { id: params.id } });
  } catch (e) {
    // Kemungkinan besar sebab masih ada peserta (ClassRegistration) berdaftar
    // untuk kelas ni - Prisma/Postgres tolak padam disebabkan foreign key.
    return NextResponse.redirect(
      new URL(
        `/admin/classes?error=${encodeURIComponent(
          "Tidak boleh padam - masih ada peserta berdaftar untuk program/kelas ini. Buang pendaftaran peserta dahulu (lihat halaman Peserta) sebelum padam."
        )}`,
        req.url
      )
    );
  }

  return NextResponse.redirect(new URL("/admin/classes", req.url));
}
