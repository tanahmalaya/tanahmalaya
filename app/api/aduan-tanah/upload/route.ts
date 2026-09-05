export const dynamic = "force-dynamic";

import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";

// Token upload terus dari browser ke Vercel Blob (elak had saiz body serverless
// function) untuk lampiran Borang Aduan Pencerobohan Tanah - lihat
// components/aduan/LampiranUpload.tsx.
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // pathname mesti bermula "aduan-tanah/foto/" atau "aduan-tanah/dokumen/"
        // (ditetapkan oleh client di components/aduan/LampiranUpload.tsx) supaya
        // constraint di bawah sepadan dengan jenis fail yang dijangka.
        const jenis = clientPayload === "dokumen" ? "dokumen" : "foto";
        if (!pathname.startsWith(`aduan-tanah/${jenis}/`)) {
          throw new Error("Laluan muat naik tidak sah.");
        }
        return jenis === "foto"
          ? {
              allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
              maximumSizeInBytes: 10 * 1024 * 1024,
              addRandomSuffix: true,
            }
          : {
              allowedContentTypes: [
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              ],
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
