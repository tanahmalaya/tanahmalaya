export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = await req.json();
  const orderIds: string[] = body.orderIds || [];

  await prisma.order.updateMany({
    where: { id: { in: orderIds } },
    data: { printedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
