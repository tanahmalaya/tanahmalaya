export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

const SOURCE_URL = "https://infobencanajkmv2.jkm.gov.my/api/pusat-buka.php?a=0&b=1";

type SourcePoint = {
  id: number;
  name: string;
  latti: number;
  longi: number;
  negeri: string;
  daerah: string;
  mukim: string;
  bencana: string;
  mangsa: number;
  keluarga: number;
  kapasiti: number;
};

export async function GET() {
  try {
    const res = await fetch(SOURCE_URL, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Sumber JKM memulangkan status ${res.status}`);
    }

    const data = (await res.json()) as { points?: SourcePoint[] };
    const points = data.points ?? [];

    return NextResponse.json({
      points,
      fetchedAt: new Date().toISOString(),
      source: "Jabatan Kebajikan Masyarakat (InfoBencanaJKM)",
    });
  } catch (err) {
    return NextResponse.json(
      {
        points: [],
        fetchedAt: new Date().toISOString(),
        source: "Jabatan Kebajikan Masyarakat (InfoBencanaJKM)",
        error: "Gagal mendapatkan data terkini daripada sumber rasmi. Sila cuba lagi sebentar.",
      },
      { status: 200 }
    );
  }
}
