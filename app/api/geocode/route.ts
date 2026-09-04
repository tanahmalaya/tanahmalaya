export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const USER_AGENT = "tanahmalaya.org peta-banjir (info@tanahmalaya.org)";

export type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
};

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 3) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("q", q);
    url.searchParams.set("countrycodes", "my");
    url.searchParams.set("limit", "6");
    url.searchParams.set("addressdetails", "0");

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "ms,en" },
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
    const results: GeocodeResult[] = data.map((d) => ({
      label: d.display_name,
      lat: parseFloat(d.lat),
      lng: parseFloat(d.lon),
    }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Gagal mencari lokasi. Sila cuba lagi." });
  }
}
