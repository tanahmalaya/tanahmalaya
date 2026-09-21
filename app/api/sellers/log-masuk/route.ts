export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signSellerSession, setSellerCookie } from "@/lib/sellerAuth";
import { sahkanTurnstile, ipDariRequest } from "@/lib/turnstile";
import { MAX_CUBAAN_LOG_MASUK, TEMPOH_KUNCI_MINIT } from "@/lib/sellerPassword";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Please enter your password."),
  turnstileToken: z.string().nullable().optional(),
});

// Log masuk akaun GERAN dengan kata laluan. Akaun lama (passwordHash null)
// dihalakan ke aliran set kata laluan - lihat app/api/sellers/lupa-kata-laluan.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid data" }, { status: 400 });
  }

  const { email, password, turnstileToken } = parsed.data;

  const semakan = await sahkanTurnstile(turnstileToken, ipDariRequest(req));
  if (!semakan.ok) {
    return NextResponse.json({ error: semakan.sebab }, { status: 400 });
  }

  const seller = await prisma.seller.findUnique({ where: { email } });

  // Mesej sama untuk emel tak wujud dan kata laluan salah - jangan beritahu
  // orang luar emel mana yang ada akaun.
  const GAGAL = { error: "Incorrect email or password." };

  if (!seller) {
    return NextResponse.json(GAGAL, { status: 401 });
  }

  if (seller.dikunciSehingga && seller.dikunciSehingga.getTime() > Date.now()) {
    const minit = Math.ceil((seller.dikunciSehingga.getTime() - Date.now()) / 60000);
    return NextResponse.json(
      { error: `Too many failed attempts. Please try again in ${minit} minute(s), or reset your password.` },
      { status: 429 }
    );
  }

  if (!seller.passwordHash) {
    return NextResponse.json(
      {
        error: "This account was created before passwords were introduced. Please set a password to continue.",
        kod: "PERLU_SET_KATA_LALUAN",
      },
      { status: 409 }
    );
  }

  const sah = await bcrypt.compare(password, seller.passwordHash);
  if (!sah) {
    const cubaan = seller.cubaanLogMasuk + 1;
    await prisma.seller.update({
      where: { id: seller.id },
      data: {
        cubaanLogMasuk: cubaan,
        dikunciSehingga:
          cubaan >= MAX_CUBAAN_LOG_MASUK ? new Date(Date.now() + TEMPOH_KUNCI_MINIT * 60 * 1000) : null,
      },
    });
    return NextResponse.json(GAGAL, { status: 401 });
  }

  await prisma.seller.update({
    where: { id: seller.id },
    data: { cubaanLogMasuk: 0, dikunciSehingga: null },
  });
  await prisma.loginEvent.create({ data: { actorType: "SELLER", actorId: seller.id } });

  setSellerCookie(signSellerSession(seller.id));
  return NextResponse.json({ fullName: seller.fullName });
}
