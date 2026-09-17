export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSellerSession } from "@/lib/sellerAuth";

const schema = z.object({
  namaPenuh: z.string().min(3),
  telefon: z.string().min(8),
  negeri: z.string().min(2),
  modelDrone: z.string().min(2),
});

export async function POST(req: NextRequest) {
  const session = getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in again" }, { status: 401 });
  }

  const seller = await prisma.seller.findUnique({ where: { id: session.sellerId } });
  if (!seller) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const existing = await prisma.dronePilotApplication.findFirst({
    where: { sellerId: seller.id, status: { in: ["MENUNGGU_SEMAKAN", "DISAHKAN"] } },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have a Drone Pilot application/status." }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const permohonan = await prisma.dronePilotApplication.create({
    data: { sellerId: seller.id, ...parsed.data },
  });

  return NextResponse.json({ id: permohonan.id, seq: permohonan.seq });
}
