export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSellerSession } from "@/lib/sellerAuth";

const schema = z.object({ geranId: z.string().min(1) });

// Toggle favorite (add if not saved, remove if already saved) - see
// components/geran/FavoriteButton.tsx & app/geran/favorite/page.tsx.
export async function POST(req: NextRequest) {
  const session = getSellerSession();
  if (!session) {
    return NextResponse.json({ error: "Please log in again" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { geranId } = parsed.data;

  const existing = await prisma.geranFavorite.findUnique({
    where: { sellerId_geranId: { sellerId: session.sellerId, geranId } },
  });

  if (existing) {
    await prisma.geranFavorite.delete({ where: { id: existing.id } });
    return NextResponse.json({ favorited: false });
  }

  const geran = await prisma.geran.findUnique({ where: { id: geranId } });
  if (!geran) {
    return NextResponse.json({ error: "Geran not found" }, { status: 404 });
  }

  await prisma.geranFavorite.create({ data: { sellerId: session.sellerId, geranId } });
  return NextResponse.json({ favorited: true });
}
