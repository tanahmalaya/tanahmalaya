export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_Membership } from "@/lib/bayarcash";
import { getYuranMembershipSen } from "@/lib/settings";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No KP mesti 12 digit tanpa tanda -"),
  phone: z.string().min(9),
  email: z.string().email(),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = schema.parse({
    fullName: form.get("fullName"),
    icNumber: form.get("icNumber"),
    phone: form.get("phone"),
    email: form.get("email"),
  });

  // Semak dulu No. KP ni belum jadi AHLI sedia ada
  const existing = await prisma.member.findUnique({ where: { icNumber: data.icNumber } });
  if (existing) {
    return NextResponse.json(
      { error: "No. Kad Pengenalan ini sudah berdaftar sebagai ahli." },
      { status: 400 }
    );
  }

  // Cipta rekod SEMENTARA - Member sebenar hanya dicipta selepas bayaran berjaya
  const pending = await prisma.pendingRegistration.create({
    data: {
      fullName: data.fullName,
      icNumber: data.icNumber,
      phone: data.phone,
      email: data.email,
    },
  });

  const yuranSen = await getYuranMembershipSen();

  const intent = await createBayarcashPaymentIntent({
    portalKey: BAYARCASH_PORTAL_Membership,
    orderId: pending.id,
    amountSen: yuranSen,
    payerName: pending.fullName,
    payerEmail: pending.email,
    payerPhone: pending.phone,
    description: `Yuran Membership PLT - ${pending.fullName}`,
    returnPath: "/Membership/berjaya",
  });

  return NextResponse.json({ url: intent.url });
}

// Untuk dashboard admin - senarai ahli
export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(members);
}
