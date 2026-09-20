import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "geran_admin_session";

export function signGeranAdminSession(geranAdminId: string) {
  return jwt.sign({ geranAdminId }, JWT_SECRET, { expiresIn: "7d" });
}

export function setGeranAdminCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearGeranAdminCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getGeranAdminSession(): { geranAdminId: string } | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { geranAdminId: string };
    return { geranAdminId: decoded.geranAdminId };
  } catch {
    return null;
  }
}

export function requireGeranAdmin() {
  const session = getGeranAdminSession();
  if (!session) redirect("/geran/admin/login");
  return session;
}
