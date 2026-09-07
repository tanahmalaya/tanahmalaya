export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendMemberActivatedEmail } from "@/lib/receiptEmails";

// Admin sahkan Ahli PLT (bermastautin/berdaftar mengundi Selangor - disemak
// manual di portal SPR) - tukar status daripada MENUNGGU_SEMAKAN ke AKTIF.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const member = await prisma.member.update({
    where: { id: params.id },
    data: { status: "AKTIF" },
  });

  try {
    await sendMemberActivatedEmail(member);
  } catch (e) {
    console.error("Gagal hantar email keahlian aktif:", e);
  }

  return NextResponse.redirect(new URL("/admin/members", req.url));
}
