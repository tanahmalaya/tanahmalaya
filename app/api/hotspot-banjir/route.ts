export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// Sumber tidak rasmi (data kerja dalaman PLANMalaysia yang kebetulan boleh diakses
// awam, bukan produk data terbuka rasmi) — hanya liputi Selangor & WP Kuala Lumpur.
// Boleh berhenti berfungsi bila-bila masa; kegagalan dikendalikan secara senyap.
const SOURCE_URL =
  "https://gisdev.planmalaysia.gov.my/server/rest/services/Analitik_Alam_Sekitar/Hotspot_Banjir_1014/FeatureServer/2/query?where=1%3D1&outFields=Negeri,Name,Daerah&returnGeometry=true&f=json&resultRecordCount=500";

export type HotspotBanjir = {
  id: number;
  name: string;
  daerah: string;
  negeri: string;
  lat: number;
  lng: number;
};

let cache: { data: HotspotBanjir[]; fetchedAt: string } | null = null;
const CACHE_MS = 60 * 60 * 1000; // data hampir statik — cache 1 jam

export async function GET() {
  const isStale = !cache || Date.now() - new Date(cache.fetchedAt).getTime() > CACHE_MS;

  if (isStale) {
    try {
      const res = await fetch(SOURCE_URL, { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as {
          features?: Array<{
            attributes: { Negeri: string; Name: string; Daerah: string };
            geometry?: { x: number; y: number };
          }>;
        };

        const hotspots: HotspotBanjir[] = (data.features ?? [])
          .filter((f) => f.geometry)
          .map((f, i) => ({
            id: i + 1,
            name: f.attributes.Name,
            daerah: f.attributes.Daerah,
            negeri: f.attributes.Negeri,
            lat: f.geometry!.y,
            lng: f.geometry!.x,
          }));

        if (hotspots.length > 0) {
          cache = { data: hotspots, fetchedAt: new Date().toISOString() };
        }
      }
    } catch {
      // biarkan cache sedia ada (jika ada) kekal; jika tiada, pulangkan senarai kosong
    }
  }

  return NextResponse.json({
    hotspots: cache?.data ?? [],
    fetchedAt: cache?.fetchedAt ?? new Date().toISOString(),
    source: "PLANMalaysia (tidak rasmi, liputan Selangor & WP KL sahaja)",
    error: !cache ? "Gagal mendapatkan senarai hotspot banjir. Sila cuba lagi sebentar." : undefined,
  });
}
