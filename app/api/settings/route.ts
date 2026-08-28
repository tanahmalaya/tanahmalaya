export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { setYuranKeahlianSen } from "@/lib/settings";

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const yuranRM = parseFloat(String(form.get("yuranKeahlian")));

  if (isNaN(yuranRM) || yuranRM <= 0) {
    return NextResponse.json({ error: "Jumlah tidak sah" }, { status: 400 });
  }

  await setYuranKeahlianSen(Math.round(yuranRM * 100));

  return NextResponse.redirect(new URL("/admin/settings", req.url));
}
