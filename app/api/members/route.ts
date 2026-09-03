export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_KEAHLIAN } from "@/lib/bayarcash";
import { getYuranSen } from "@/lib/settings";
import { isValidMalaysianIC, getAgeFromIC, MIN_AGE_AHLI_PLT } from "@/lib/ic";
import { z } from "zod";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No KP mesti 12 digit tanpa tanda -"),
  phone: z.string().min(9),
  email: z.string().email(),
  memberType: z.enum(["PLT", "BERSEKUTU"]),
  akuanSelangor: z.coerce.boolean().optional().default(false),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = schema.parse({
    fullName: form.get("fullName"),
    icNumber: form.get("icNumber"),
    phone: form.get("phone"),
    email: form.get("email"),
    memberType: form.get("memberType"),
    akuanSelangor: form.get("akuanSelangor"),
  });

  const icCheck = isValidMalaysianIC(data.icNumber);
  if (!icCheck.valid) {
    return NextResponse.json({ error: icCheck.reason }, { status: 400 });
  }

  if (data.memberType === "PLT") {
    if (getAgeFromIC(data.icNumber) < MIN_AGE_AHLI_PLT) {
      return NextResponse.json(
        { error: `Ahli PLT mesti berumur ${MIN_AGE_AHLI_PLT} tahun ke atas.` },
        { status: 400 }
      );
    }
    if (!data.akuanSelangor) {
      return NextResponse.json(
        { error: "Ahli PLT wajib mengesahkan akujanji berdaftar mengundi di Selangor." },
        { status: 400 }
      );
    }
  }

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
      memberType: data.memberType,
      akuanSelangor: data.akuanSelangor,
    },
  });

  const yuranSen = await getYuranSen(data.memberType);
  const jenisLabel = data.memberType === "PLT" ? "Ahli PLT" : "Ahli Bersekutu";

  try {
    const intent = await createBayarcashPaymentIntent({
      portalKey: BAYARCASH_PORTAL_KEAHLIAN,
      orderId: pending.id,
      amountSen: yuranSen,
      payerName: pending.fullName,
      payerEmail: pending.email,
      payerPhone: pending.phone,
      description: `Yuran ${jenisLabel} PLT - ${pending.fullName}`,
      returnPath: `${data.memberType === "PLT" ? "/keahlian/semak-plt" : "/keahlian/semak"}?fullName=${encodeURIComponent(pending.fullName)}&icNumber=${encodeURIComponent(pending.icNumber)}`,
    });

    return NextResponse.json({ url: intent.url });
  } catch (e) {
    // Gagal jana pautan bayaran - padam rekod sementara supaya tak jadi
    // sampah dalam DB (Member sebenar cuma dicipta lepas bayaran berjaya).
    await prisma.pendingRegistration.delete({ where: { id: pending.id } });
    return NextResponse.json(
      { error: "Gagal mendapatkan pautan pembayaran. Sila cuba lagi." },
      { status: 502 }
    );
  }
}

// Untuk dashboard admin - senarai ahli
export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(members);
}
