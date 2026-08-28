export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getYuranKeahlianSen } from "@/lib/settings";

export async function GET() {
  const yuranSen = await getYuranKeahlianSen();
  return NextResponse.json({ yuranSen });
}
