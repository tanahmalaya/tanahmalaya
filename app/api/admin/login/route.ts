import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signAdminSession, setAdminCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email"));
  const password = String(form.get("password"));

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.redirect(new URL("/admin/login?error=1", req.url));
  }

  const role = admin.role === "STAFF" ? "STAFF" : "ADMIN";
  setAdminCookie(signAdminSession(admin.id, role));
  return NextResponse.redirect(new URL(role === "STAFF" ? "/admin/orders" : "/admin", req.url));
}
