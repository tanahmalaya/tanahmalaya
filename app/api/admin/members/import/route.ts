export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const memberType = form.get("memberType") === "BERSEKUTU" ? "BERSEKUTU" : "PLT";
  await prisma.member.create({
    data: {
      memberNo: String(form.get("memberNo")),
      fullName: String(form.get("fullName")),
      icNumber: String(form.get("icNumber")),
      phone: String(form.get("phone")),
      email: String(form.get("email")),
      type: memberType,
      status: "AKTIF",
      addedManually: true,
    },
  });

  return NextResponse.redirect(new URL("/admin/members", req.url));
}
