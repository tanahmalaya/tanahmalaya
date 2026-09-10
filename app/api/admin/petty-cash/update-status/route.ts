export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { sendClaimApprovedEmail, sendClaimRejectedEmail, sendClaimPaidEmail } from "@/lib/receiptEmails";

const VALID_TRANSITIONS: Record<string, string[]> = {
  MENUNGGU: ["DILULUSKAN", "DITOLAK"],
  DILULUSKAN: ["DIBAYAR", "DITOLAK"],
};

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const claimId: string = body.claimId;
  const status: "DILULUSKAN" | "DITOLAK" | "DIBAYAR" = body.status;
  const catatanAdmin: string | null = body.catatanAdmin || null;

  const claim = await prisma.pettyCashClaim.findUnique({
    where: { id: claimId },
    include: { member: { select: { email: true } } },
  });
  if (!claim) {
    return NextResponse.json({ error: "Tuntutan tidak dijumpai" }, { status: 404 });
  }
  if (!VALID_TRANSITIONS[claim.status]?.includes(status)) {
    return NextResponse.json({ error: `Tidak boleh tukar status daripada ${claim.status} ke ${status}` }, { status: 400 });
  }

  const updated = await prisma.pettyCashClaim.update({
    where: { id: claimId },
    data: { status, catatanAdmin: status === "DITOLAK" ? catatanAdmin : claim.catatanAdmin },
  });

  try {
    const emailPayload = { seq: updated.seq, namaPemohon: updated.namaPemohon, email: claim.member.email, jumlahSen: updated.jumlahSen };
    if (status === "DILULUSKAN") await sendClaimApprovedEmail(emailPayload);
    if (status === "DITOLAK") await sendClaimRejectedEmail({ ...emailPayload, catatanAdmin: updated.catatanAdmin });
    if (status === "DIBAYAR") await sendClaimPaidEmail(emailPayload);
  } catch (e) {
    console.error("Gagal hantar emel status tuntutan petty cash:", e);
  }

  return NextResponse.json({ ok: true });
}
