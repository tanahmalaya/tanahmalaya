export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { setYuranSen } from "@/lib/settings";

export async function POST(req: NextRequest) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const form = await req.formData();
  const yuranPltRM = parseFloat(String(form.get("yuranPlt")));
  const yuranBersekutuRM = parseFloat(String(form.get("yuranBersekutu")));

  if (isNaN(yuranPltRM) || yuranPltRM <= 0 || isNaN(yuranBersekutuRM) || yuranBersekutuRM <= 0) {
    return NextResponse.json({ error: "Jumlah tidak sah" }, { status: 400 });
  }

  await Promise.all([
    setYuranSen("PLT", Math.round(yuranPltRM * 100)),
    setYuranSen("BERSEKUTU", Math.round(yuranBersekutuRM * 100)),
  ]);

  return NextResponse.redirect(new URL("/admin/settings", req.url));
}
