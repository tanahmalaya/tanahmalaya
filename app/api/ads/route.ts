export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const ads = await prisma.ad.findMany({ where: { aktif: true }, orderBy: { susunan: "asc" } });
  return NextResponse.json(ads);
}
