export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signMemberSession, setMemberCookie } from "@/lib/memberAuth";

const schema = z.object({
  fullName: z.string().min(2),
  icNumber: z.string().regex(/^\d{12}$/, "No Kad Pengenalan mesti 12 digit tanpa tanda -"),
});

function normalisaNama(nama: string) {
  return nama.trim().toLowerCase().replace(/\s+/g, " ");
}

// Log masuk kawasan Ahli PLT (borang claim petty cash, kelas & program, peta) -
// guna nama + No KP sama macam Semak Keahlian (lihat app/api/members/check),
// tapi di sini kita SIMPAN sesi (cookie) lepas berjaya, dan hanya benarkan
// Ahli PLT yang statusnya AKTIF (Ahli Bersekutu / tak aktif ditolak di sini).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Data tidak sah" }, { status: 400 });
  }

  const { fullName, icNumber } = parsed.data;

  const member = await prisma.member.findUnique({ where: { icNumber } });
  if (!member || normalisaNama(member.fullName) !== normalisaNama(fullName)) {
    return NextResponse.json(
      { error: "Ahli tidak dijumpai. Sila semak semula nama dan No Kad Pengenalan anda." },
      { status: 404 }
    );
  }

  if (member.type !== "PLT" || member.status !== "AKTIF") {
    return NextResponse.json(
      {
        error:
          member.type !== "PLT"
            ? "Kawasan ini hanya untuk Ahli PLT. Rekod anda didaftarkan sebagai Ahli Bersekutu."
            : "Akaun Ahli PLT anda belum aktif. Sila hubungi PLT jika ini tidak dijangka.",
      },
      { status: 403 }
    );
  }

  setMemberCookie(signMemberSession(member.id));
  return NextResponse.json({ fullName: member.fullName, memberNo: member.memberNo });
}
