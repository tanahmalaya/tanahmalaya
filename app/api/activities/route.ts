export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const activities = await prisma.activity.findMany({ orderBy: { tarikh: "desc" } });
  return NextResponse.json(activities);
}

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  await prisma.activity.create({
    data: {
      tarikh: new Date(String(form.get("tarikh"))),
      tajuk: String(form.get("tajuk")),
      keterangan: String(form.get("keterangan")),
      gambarUrl: String(form.get("gambarUrl") || "") || null,
    },
  });

  return NextResponse.redirect(new URL("/admin/activities", req.url));
}
