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

  setAdminCookie(signAdminSession(admin.id));
  return NextResponse.redirect(new URL("/admin", req.url));
}
