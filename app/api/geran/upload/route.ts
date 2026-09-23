export const dynamic = "force-dynamic";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSellerSession } from "@/lib/sellerAuth";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import { MAX_SAIZ_GAMBAR_BYTES, MAX_SAIZ_SALINAN_BYTES } from "@/lib/geran";
import { MAX_SAIZ_360_BYTES } from "@/lib/geran/panorama";

// Upload token straight from the browser to Vercel Blob for Geran photos -
// see components/geran/GambarGeranUpload.tsx. Same pattern as
// app/api/petty-cash/upload/route.ts.
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Penjual muat naik dari /geran/jual, admin GERAN pula dari
  // /geran/admin/tambah.
  const admin = !!getGeranAdminSession();
  if (!getSellerSession() && !admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Dua jenis fail: gambar tanah untuk paparan awam, dan salinan penuh
        // geran (PDF) yang hanya dipapar dalam dashboard admin.
        if (pathname.startsWith("geran/gambar/")) {
          return {
            allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
            maximumSizeInBytes: MAX_SAIZ_GAMBAR_BYTES,
            addRandomSuffix: true,
          };
        }
        // Panorama 360° - admin sahaja (GT/KJ Land rakam sendiri). Sudah
        // dimampat ke WebP dalam pelayar, lihat components/geran/admin/panorama.
        if (pathname.startsWith("geran/360/")) {
          if (!admin) throw new Error("Not authorized.");
          return {
            allowedContentTypes: ["image/webp", "image/jpeg"],
            maximumSizeInBytes: MAX_SAIZ_360_BYTES,
            addRandomSuffix: true,
          };
        }
        if (pathname.startsWith("geran/salinan/")) {
          return {
            allowedContentTypes: ["application/pdf"],
            maximumSizeInBytes: MAX_SAIZ_SALINAN_BYTES,
            addRandomSuffix: true,
          };
        }
        throw new Error("Invalid upload path.");
      },
      onUploadCompleted: async () => {},
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
