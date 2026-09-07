export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendMemberRejectedEmail } from "@/lib/receiptEmails";

// Admin TAK dapat sahkan Ahli PLT bermastautin/berdaftar mengundi Selangor
// (dah semak di portal SPR) - tukar status ke TIDAK_AKTIF.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const member = await prisma.member.update({
    where: { id: params.id },
    data: { status: "TIDAK_AKTIF" },
  });

  try {
    await sendMemberRejectedEmail(member);
  } catch (e) {
    console.error("Gagal hantar email keahlian ditolak:", e);
  }

  return NextResponse.redirect(new URL("/admin/members", req.url));
}
