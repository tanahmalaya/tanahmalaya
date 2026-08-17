export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createBayarcashPaymentIntent } from "@/lib/bayarcash";
import { z } from "zod";

const YURAN_KEAHLIAN_SEN = 500; // RM5.00

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No KP mesti 12 digit tanpa tanda -"),
  phone: z.string().min(9),
  email: z.string().email(),
});

const MEMBER_NO_START = 600; // no ahli baharu (daftar web) mula dari sini

async function nextMemberNo() {
  const members = await prisma.member.findMany({ select: { memberNo: true } });
  const numbers = members
    .map((m) => parseInt(m.memberNo.replace(/\D/g, ""), 10))
    .filter((n) => !isNaN(n));
  const highest = numbers.length > 0 ? Math.max(...numbers) : 0;
  const next = Math.max(highest + 1, MEMBER_NO_START);
  return `PLT-${String(next).padStart(3, "0")}`;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const data = schema.parse({
    fullName: form.get("fullName"),
    icNumber: form.get("icNumber"),
    phone: form.get("phone"),
    email: form.get("email"),
  });

  const member = await prisma.member.create({
    data: {
      memberNo: await nextMemberNo(),
      fullName: data.fullName,
      icNumber: data.icNumber,
      phone: data.phone,
      email: data.email,
      status: "MENUNGGU_BAYARAN",
    },
  });

  const intent = await createBayarcashPaymentIntent({
    orderId: member.id,
    amountSen: YURAN_KEAHLIAN_SEN,
    payerName: member.fullName,
    payerEmail: member.email,
    description: `Yuran Keahlian PLT - ${member.memberNo}`,
  });

  return NextResponse.redirect(intent.url);
}

// Untuk dashboard admin - senarai ahli
export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(members);
}
