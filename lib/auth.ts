import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "plt_admin_session";

type AdminRole = "ADMIN" | "STAFF";

export function signAdminSession(adminId: string, role: AdminRole) {
  return jwt.sign({ adminId, role }, JWT_SECRET, { expiresIn: "7d" });
}

export function setAdminCookie(token: string) {
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}

export function getAdminSession(): { adminId: string; role: AdminRole } | null {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string; role?: AdminRole };
    return { adminId: decoded.adminId, role: decoded.role || "ADMIN" };
  } catch {
    return null;
  }
}

/**
 * Panggil di bahagian ATAS setiap laman admin yang HANYA untuk role "ADMIN"
 * (bukan Pesanan). Kalau staff cuba akses, dia akan redirect balik ke /admin/orders.
 */
export function requireAdminOnly() {
  const session = getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "ADMIN") redirect("/admin/orders");
}
