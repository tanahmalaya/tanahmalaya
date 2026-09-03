export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// Admin sahkan Ahli PLT (bermastautin/berdaftar mengundi Selangor - disemak
// manual di portal SPR) - tukar status daripada MENUNGGU_SEMAKAN ke AKTIF.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  await prisma.member.update({
    where: { id: params.id },
    data: { status: "AKTIF" },
  });

  return NextResponse.redirect(new URL("/admin/members", req.url));
}
