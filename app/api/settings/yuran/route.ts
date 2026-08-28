export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getYuranMembershipSen } from "@/lib/settings";

export async function GET() {
  const yuranSen = await getYuranMembershipSen();
  return NextResponse.json({ yuranSen });
}
