export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const classes = await prisma.landClass.findMany({ orderBy: { tarikh: "asc" } });
  return NextResponse.json(classes);
}

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  await prisma.landClass.create({
    data: {
      tarikh: new Date(String(form.get("tarikh"))),
      namaKelas: String(form.get("namaKelas")),
      topik: String(form.get("topik")),
      lokasi: String(form.get("lokasi")),
      status: String(form.get("status")) as "TERBUKA" | "PENUH" | "TAMAT",
    },
  });

  return NextResponse.redirect(new URL("/admin/classes", req.url));
}
