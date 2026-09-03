export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getYuranSen } from "@/lib/settings";

export async function GET() {
  const [pltSen, bersekutuSen] = await Promise.all([getYuranSen("PLT"), getYuranSen("BERSEKUTU")]);
  return NextResponse.json({ pltSen, bersekutuSen });
}
