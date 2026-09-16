export const dynamic = "force-dynamic";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSellerSession } from "@/lib/sellerAuth";

// Token upload terus dari browser ke Vercel Blob untuk gambar Geran - lihat
// components/geran/GambarGeranUpload.tsx. Sama pattern macam
// app/api/petty-cash/upload/route.ts.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!getSellerSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("geran/gambar/")) {
          throw new Error("Laluan muat naik tidak sah.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
