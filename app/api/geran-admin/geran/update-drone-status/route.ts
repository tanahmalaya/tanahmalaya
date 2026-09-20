export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getGeranAdminSession } from "@/lib/geran-admin-auth";

const VALID_STATUS = ["MENUNGGU_PILOT", "DIJADUALKAN", "SELESAI"];

// Update drone survey request status (basic - admin handles this manually,
// no full pilot registration/scheduling system yet). See StatusDroneSurvey
// in prisma/schema.prisma.
export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = await req.json();
  const geranId: string = body.geranId;
  const statusDroneSurvey: string = body.statusDroneSurvey;

  if (!VALID_STATUS.includes(statusDroneSurvey)) {
    return NextResponse.json({ error: "Invalid drone status" }, { status: 400 });
  }

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran || !geran.mintaDroneSurvey) {
    return NextResponse.json({ error: "Geran not found or drone survey not requested" }, { status: 404 });
  }

  await prisma.geran.update({
    where: { id: geranId },
    data: { statusDroneSurvey: statusDroneSurvey as "MENUNGGU_PILOT" | "DIJADUALKAN" | "SELESAI" },
  });

  return NextResponse.json({ ok: true });
}
