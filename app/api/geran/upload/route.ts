export const dynamic = "force-dynamic";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { getSellerSession } from "@/lib/sellerAuth";
import { getGeranAdminSession } from "@/lib/geran/admin-auth";
import { MAX_SAIZ_GAMBAR_BYTES, MAX_SAIZ_SALINAN_BYTES } from "@/lib/geran";
import { MAX_SAIZ_360_BYTES } from "@/lib/geran/panorama";
import { MAX_SAIZ_DOKUMEN_BYTES, MIME_DOKUMEN } from "@/lib/geran/dokumen";
import { MESEJ_TIADA_STOR_PERIBADI, TOKEN_BLOB_PERIBADI, laluanPeribadi } from "@/lib/geran/blob-peribadi";

// Upload token straight from the browser to Vercel Blob for Geran photos -
// see components/geran/admin/media/TabMedia.tsx. Same pattern as
// app/api/petty-cash/upload/route.ts. Fail peribadi (dokumen, salinan geran)
// guna token stor peribadi - lihat lib/geran/blob-peribadi.ts.
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Penjual muat naik dari /geran/jual, admin GERAN pula dari
  // /geran/admin/tambah.
  const admin = !!getGeranAdminSession();
  if (!getSellerSession() && !admin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const body = (await request.json()) as HandleUploadBody;

  // Pilih stor ikut laluan. Tanpa semakan ini, muat naik peribadi ke stor
  // public gagal di pelayar dan klien Blob mencuba semula ~10 kali - admin
  // nampak butang berpusing selama beberapa minit tanpa sebarang mesej.
  const pathname = body.type === "blob.generate-client-token" ? body.payload.pathname : "";
  const peribadi = laluanPeribadi(pathname);
  if (peribadi && !TOKEN_BLOB_PERIBADI) {
    return NextResponse.json({ error: MESEJ_TIADA_STOR_PERIBADI }, { status: 503 });
  }

  try {
    const jsonResponse = await handleUpload({
      token: peribadi ? TOKEN_BLOB_PERIBADI : undefined,
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
        // Document Vault - admin sahaja; klien muat naik dengan access:
        // "private", jadi fail hanya boleh dibaca melalui
        // app/api/geran/dokumen/[id] yang menyemak tahap akses.
        if (pathname.startsWith("geran/dokumen/")) {
          if (!admin) throw new Error("Not authorized.");
          return {
            allowedContentTypes: [...MIME_DOKUMEN],
            maximumSizeInBytes: MAX_SAIZ_DOKUMEN_BYTES,
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
