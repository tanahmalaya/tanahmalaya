import { NextRequest, NextResponse } from "next/server";
import { clearGeranAdminCookie } from "@/lib/geran-admin-auth";

export async function POST(req: NextRequest) {
  clearGeranAdminCookie();
  return NextResponse.redirect(new URL("/geran/admin/login", req.url), 303);
}
