export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  try {
    await prisma.activity.delete({ where: { id: params.id } });
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/admin/activities?error=${encodeURIComponent("Gagal padam aktiviti. Sila cuba lagi.")}`, req.url)
    );
  }

  return NextResponse.redirect(new URL("/admin/activities", req.url));
}
