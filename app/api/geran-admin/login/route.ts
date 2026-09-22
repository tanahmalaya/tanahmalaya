import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signGeranAdminSession, setGeranAdminCookie } from "@/lib/geran/admin-auth";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const email = String(form.get("email"));
  const password = String(form.get("password"));

  const admin = await prisma.geranAdminUser.findUnique({ where: { email } });
  if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
    return NextResponse.redirect(new URL("/geran/admin/login?error=1", req.url), 303);
  }

  setGeranAdminCookie(signGeranAdminSession(admin.id));
  return NextResponse.redirect(new URL("/geran/admin", req.url), 303);
}
