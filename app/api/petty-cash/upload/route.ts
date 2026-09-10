export const dynamic = "force-dynamic";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getMemberSession } from "@/lib/memberAuth";

// Token upload terus dari browser ke Vercel Blob untuk resit Tuntutan Petty
// Cash - lihat components/petty-cash/BorangClaimForm.tsx. Sama pattern macam
// app/api/aduan-tanah/upload/route.ts.
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!getMemberSession()) {
    return NextResponse.json({ error: "Tidak dibenarkan" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith("petty-cash/resit/")) {
          throw new Error("Laluan muat naik tidak sah.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
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
