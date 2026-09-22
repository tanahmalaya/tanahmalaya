export const dynamic = "force-dynamic";
// Membaca imej dan memanggil model mengambil masa jauh melebihi had lalai 10s.
export const maxDuration = 60;

// Imbas geran -> isi borang. Admin GERAN sahaja.
//
// Imej TIDAK disimpan di mana-mana: ia masuk dalam permintaan, dihantar ke API
// Claude untuk dibaca, dan dilepaskan. Yang kembali kepada pelayar hanyalah
// medan borang - bukan nama pemilik, nombor kad pengenalan, atau alamat (lihat
// arahan dalam lib/geranScan.ts).

import { NextRequest, NextResponse } from "next/server";
import { getGeranAdminSession } from "@/lib/geran-admin-auth";
import { RalatKunciApi, imbasGeranDariImej } from "@/lib/geranScan";
import { MAX_SAIZ_GAMBAR_BYTES, formatSaizFail } from "@/lib/geran";

const JENIS_DIBENARKAN = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(req: NextRequest) {
  if (!getGeranAdminSession()) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  let fail: File | null = null;
  try {
    const borang = await req.formData();
    const nilai = borang.get("imej");
    if (nilai instanceof File) fail = nilai;
  } catch {
    return NextResponse.json({ error: "Permintaan tak sah." }, { status: 400 });
  }

  if (!fail) {
    return NextResponse.json({ error: "Tiada imej dihantar." }, { status: 400 });
  }
  if (!JENIS_DIBENARKAN.has(fail.type)) {
    return NextResponse.json(
      { error: "Guna fail JPEG, PNG atau WEBP. Untuk PDF, ambil tangkapan skrin halaman geran dahulu." },
      { status: 400 }
    );
  }
  if (fail.size > MAX_SAIZ_GAMBAR_BYTES) {
    return NextResponse.json(
      { error: `Imej melebihi had ${formatSaizFail(MAX_SAIZ_GAMBAR_BYTES)}.` },
      { status: 400 }
    );
  }

  try {
    const hasil = await imbasGeranDariImej(Buffer.from(await fail.arrayBuffer()));
    return NextResponse.json({ ok: true, hasil });
  } catch (err) {
    if (err instanceof RalatKunciApi) {
      // Kesilapan konfigurasi, bukan kesilapan admin - katakan dengan jelas
      // supaya tiada siapa membuang masa menyalahkan kualiti imbasan.
      return NextResponse.json(
        { error: "Ciri imbas belum dikonfigurasi: ANTHROPIC_API_KEY tiada pada pelayan." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: (err as Error).message || "Gagal membaca imej." },
      { status: 502 }
    );
  }
}
