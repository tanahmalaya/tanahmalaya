export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();

  try {
    await prisma.activity.update({
      where: { id: params.id },
      data: {
        tarikh: new Date(String(form.get("tarikh"))),
        tajuk: String(form.get("tajuk")),
        keterangan: String(form.get("keterangan")),
        gambar1: String(form.get("gambar1") || "") || null,
        gambar2: String(form.get("gambar2") || "") || null,
        gambar3: String(form.get("gambar3") || "") || null,
        gambar4: String(form.get("gambar4") || "") || null,
      },
    });
  } catch (e) {
    return NextResponse.redirect(
      new URL(`/admin/activities?error=${encodeURIComponent("Aktiviti tidak dijumpai atau ralat semasa kemaskini.")}`, req.url)
    );
  }

  return NextResponse.redirect(new URL("/admin/activities", req.url));
}
