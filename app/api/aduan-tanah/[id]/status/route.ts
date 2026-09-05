export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["BAHARU", "DALAM_SEMAKAN", "SELESAI"]),
  notaAdmin: z.string().max(5000).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  if (!getAdminSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  let data;
  try {
    data = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Data tidak sah." }, { status: 400 });
  }

  await prisma.landComplaint.update({
    where: { id: params.id },
    data: { status: data.status, notaAdmin: data.notaAdmin || null },
  });

  return NextResponse.json({ ok: true });
}
