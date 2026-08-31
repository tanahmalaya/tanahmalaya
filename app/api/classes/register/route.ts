export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_PROGRAM } from "@/lib/bayarcash";
import { z } from "zod";

const schema = z.object({
  classId: z.string().min(1),
  namaPeserta: z.string().min(2),
  telefon: z.string().min(9),
  emel: z.string().email(),
});

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = schema.parse({
    classId: form.get("classId"),
    namaPeserta: form.get("namaPeserta"),
    telefon: form.get("telefon"),
    emel: form.get("emel"),
  });

  const kelas = await prisma.landClass.findUnique({
    where: { id: data.classId },
    include: { registrations: { where: { status: "BERJAYA" } } },
  });

  if (!kelas || kelas.status !== "TERBUKA") {
    return NextResponse.json({ error: "Kelas ini tidak lagi terbuka untuk pendaftaran." }, { status: 400 });
  }

  if (kelas.maxPeserta && kelas.registrations.length >= kelas.maxPeserta) {
    return NextResponse.json({ error: "Kelas ini sudah penuh." }, { status: 400 });
  }

  const registration = await prisma.classRegistration.create({
    data: {
      classId: kelas.id,
      namaPeserta: data.namaPeserta,
      telefon: data.telefon,
      emel: data.emel,
      status: "MENUNGGU",
    },
  });

  // Kelas PERCUMA (yuran 0) - tandakan terus berjaya, tiada perlu ke BayarCash
  if (kelas.yuranSen === 0) {
    await prisma.classRegistration.update({
      where: { id: registration.id },
      data: { status: "BERJAYA" },
    });
    return NextResponse.json({ url: `/program-kelas/berjaya?free=1` });
  }

  try {
    const intent = await createBayarcashPaymentIntent({
      portalKey: BAYARCASH_PORTAL_PROGRAM,
      orderId: registration.id,
      amountSen: kelas.yuranSen,
      payerName: data.namaPeserta,
      payerEmail: data.emel,
      payerPhone: data.telefon,
      description: `Pendaftaran ${kelas.namaKelas} - PLT`,
      returnPath: "/program-kelas/berjaya",
    });

    return NextResponse.json({ url: intent.url });
  } catch (e) {
    // Gagal jana pautan bayaran - tandakan pendaftaran GAGAL supaya tak
    // tersangkut senyap sebagai MENUNGGU.
    await prisma.classRegistration.update({
      where: { id: registration.id },
      data: { status: "GAGAL" },
    });
    return NextResponse.json(
      { error: "Gagal mendapatkan pautan pembayaran. Sila cuba lagi." },
      { status: 502 }
    );
  }
}
