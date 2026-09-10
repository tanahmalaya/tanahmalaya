import { NextRequest, NextResponse } from "next/server";
import { clearMemberCookie } from "@/lib/memberAuth";

export async function POST(req: NextRequest) {
  clearMemberCookie();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
