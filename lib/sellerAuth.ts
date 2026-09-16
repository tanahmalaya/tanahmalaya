import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "plt_seller_session";

// Akaun Penjual (marketplace Geran, terbuka kepada awam) - log masuk OTP
// e-mel 1 langkah (daftar/kemaskini profil + minta kod serentak), lihat
// app/api/sellers/login-request & login-verify. Kongsi helper OTP generik
// (generateOtpCode/maskEmail/tempoh) dengan lib/memberAuth.ts.
export function signSellerSession(sellerId: string) {
  return jwt.sign({ sellerId }, JWT_SECRET, { expiresIn: "30d" });
}

export function setSellerCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSellerCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getSellerSession(): { sellerId: string } | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { sellerId: string };
    return { sellerId: decoded.sellerId };
  } catch {
    return null;
  }
}

/**
 * Panggil di bahagian ATAS laman yang hanya untuk Penjual log masuk
 * (senaraikan tanah, sejarah penyenaraian sendiri).
 */
export async function requireSeller(redirectPath: string) {
  const session = getSellerSession();
  if (!session) redirect(`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`);

  const seller = await prisma.seller.findUnique({ where: { id: session.sellerId } });
  if (!seller) {
    // Nota: TAK boleh panggil clearSellerCookie() di sini - cookies() cuma
    // boleh diubah dalam Server Action/Route Handler, bukan semasa render
    // Server Component (akan throw "Cookies can only be modified...").
    // Cookie lapuk akan ditulis ganti secara automatik bila log masuk semula
    // berjaya (setSellerCookie di login-verify).
    redirect(`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return seller;
}
