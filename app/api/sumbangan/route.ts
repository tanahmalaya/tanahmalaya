export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent, BAYARCASH_PORTAL_SUMBANGAN } from "@/lib/bayarcash";
import { z } from "zod";

const schema = z.object({
  namaPenderma: z.string().trim().min(2).max(200),
  emel: z.string().trim().email().max(200),
  telefon: z.string().trim().min(9).max(50),
  amountSen: z.number().int().min(500).max(10_000_000), // RM5 - RM100,000
});

export async function POST(req: NextRequest) {
  let data;
  try {
    data = schema.parse(await req.json());
  } catch (e) {
    const message = e instanceof z.ZodError ? e.errors[0]?.message : "Data tidak sah.";
    return NextResponse.json({ error: message || "Data tidak sah." }, { status: 400 });
  }

  const donation = await prisma.donation.create({
    data: {
      namaPenderma: data.namaPenderma,
      emel: data.emel,
      telefon: data.telefon,
      amountSen: data.amountSen,
      status: "MENUNGGU",
    },
  });

  try {
    const intent = await createBayarcashPaymentIntent({
      portalKey: BAYARCASH_PORTAL_SUMBANGAN,
      orderId: donation.id,
      amountSen: data.amountSen,
      payerName: data.namaPenderma,
      payerEmail: data.emel,
      payerPhone: data.telefon,
      description: "Sumbangan Ikhlas - Pertubuhan Literasi Tanah",
      returnPath: "/sumbangan/berjaya",
    });

    return NextResponse.json({ url: intent.url });
  } catch (e) {
    await prisma.donation.update({ where: { id: donation.id }, data: { status: "GAGAL" } });
    return NextResponse.json(
      { error: "Gagal mendapatkan pautan pembayaran. Sila cuba lagi." },
      { status: 502 }
    );
  }
}
