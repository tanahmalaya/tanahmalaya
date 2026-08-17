export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const ads = await prisma.ad.findMany({ where: { aktif: true }, orderBy: { susunan: "asc" } });
  return NextResponse.json(ads);
}

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  await prisma.ad.create({
    data: {
      namaAhli: String(form.get("namaAhli")),
      pautan: String(form.get("pautan")),
      gambarUrl: String(form.get("gambarUrl")),
      susunan: parseInt(String(form.get("susunan") || "0"), 10),
    },
  });

  return NextResponse.redirect(new URL("/admin/ads", req.url));
}
