export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

const VALID_STATUS = ["MENUNGGU_PILOT", "DIJADUALKAN", "SELESAI"];

// Kemaskini status permintaan drone survey (asas - admin proses manual,
// belum ada sistem pendaftaran/jadual pilot penuh). Lihat StatusDroneSurvey
// dalam prisma/schema.prisma.
export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const geranId: string = body.geranId;
  const statusDroneSurvey: string = body.statusDroneSurvey;

  if (!VALID_STATUS.includes(statusDroneSurvey)) {
    return NextResponse.json({ error: "Status drone tidak sah" }, { status: 400 });
  }

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran || !geran.mintaDroneSurvey) {
    return NextResponse.json({ error: "Geran tidak dijumpai atau tidak minta drone survey" }, { status: 404 });
  }

  await prisma.geran.update({
    where: { id: geranId },
    data: { statusDroneSurvey: statusDroneSurvey as "MENUNGGU_PILOT" | "DIJADUALKAN" | "SELESAI" },
  });

  return NextResponse.json({ ok: true });
}
