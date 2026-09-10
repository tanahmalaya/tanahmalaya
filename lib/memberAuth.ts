import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "plt_member_session";

export function signMemberSession(memberId: string) {
  return jwt.sign({ memberId }, JWT_SECRET, { expiresIn: "30d" });
}

export function setMemberCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearMemberCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getMemberSession(): { memberId: string } | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { memberId: string };
    return { memberId: decoded.memberId };
  } catch {
    return null;
  }
}

/**
 * Panggil di bahagian ATAS laman yang hanya untuk Ahli PLT aktif (borang
 * claim, kelas & program, peta). Redirect ke borang log masuk (bawa balik
 * ke laman asal lepas berjaya) kalau tiada sesi, ATAU kalau ahli tu rupanya
 * Ahli Bersekutu/tak aktif (semakan status semasa, bukan cuma percaya token).
 */
export async function requirePltMember(redirectPath: string) {
  const session = getMemberSession();
  if (!session) redirect(`/ahli-plt/log-masuk?redirect=${encodeURIComponent(redirectPath)}`);

  const member = await prisma.member.findUnique({ where: { id: session.memberId } });
  if (!member || member.type !== "PLT" || member.status !== "AKTIF") {
    clearMemberCookie();
    redirect(`/ahli-plt/log-masuk?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return member;
}
