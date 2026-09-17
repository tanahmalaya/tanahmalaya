import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "plt_seller_session";

// Seller account (Geran marketplace, open to the public) - 1-step email OTP
// login (sign up/update profile + request code at once), see
// app/api/sellers/login-request & login-verify. Shares the generic OTP
// helpers (generateOtpCode/maskEmail/expiry) with lib/memberAuth.ts.
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
 * Call at the TOP of pages that are logged-in Seller only
 * (list land, view own listing history).
 */
export async function requireSeller(redirectPath: string) {
  const session = getSellerSession();
  if (!session) redirect(`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`);

  const seller = await prisma.seller.findUnique({ where: { id: session.sellerId } });
  if (!seller) {
    // Note: canNOT call clearSellerCookie() here - cookies() can only be
    // modified in a Server Action/Route Handler, not during Server
    // Component rendering (throws "Cookies can only be modified...").
    // The stale cookie is automatically overwritten on the next successful
    // login (setSellerCookie in login-verify).
    redirect(`/geran/log-masuk?redirect=${encodeURIComponent(redirectPath)}`);
  }

  return seller;
}
