import { NextRequest, NextResponse } from "next/server";
import { clearSellerCookie } from "@/lib/sellerAuth";

export async function POST(req: NextRequest) {
  clearSellerCookie();
  return NextResponse.redirect(new URL("/geran", req.url), 303);
}
