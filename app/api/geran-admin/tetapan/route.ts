export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import { normalWhatsApp, simpanTetapanGT } from "@/lib/geran/tetapan";

const schema = z.object({
  whatsapp: z.string().trim().max(30),
  emel: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
});

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }
  const { whatsapp, emel } = parsed.data;
  const nombor = whatsapp ? normalWhatsApp(whatsapp) : "";
  if (nombor === null) {
    return NextResponse.json({ error: "Enter a valid phone number, e.g. 012-345 6789" }, { status: 400 });
  }
  await simpanTetapanGT({ whatsapp: nombor, emel });
  return NextResponse.json({ ok: true, whatsapp: nombor });
}
