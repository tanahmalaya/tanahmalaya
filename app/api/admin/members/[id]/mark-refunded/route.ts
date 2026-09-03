export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// Admin dah proses transfer bank refund secara manual di luar sistem -
// tandakan di sini supaya tak papar dalam senarai "menunggu refund" lagi.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  await prisma.member.update({
    where: { id: params.id },
    data: { refundedAt: new Date() },
  });

  return NextResponse.redirect(new URL("/admin/members", req.url));
}
