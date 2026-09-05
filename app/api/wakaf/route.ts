export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { WAKAF_BASE_URL, WAKAF_NEGERI, cariNegeriWakaf } from "@/lib/wakafNegeri";

type WakafPoint = { id: number; lat: number; lng: number };

type CacheEntry = { points: WakafPoint[]; jenis: "sedia_ada" | "cadangan"; fetchedAt: string };
const cache = new Map<string, CacheEntry>();
const CACHE_MS = 60 * 60 * 1000; // data hampir statik — cache 1 jam
const MAX_HALAMAN = 5; // had keselamatan elak query tanpa henti
const SAIZ_HALAMAN = 2000;

async function ambilLayer(layerId: number): Promise<WakafPoint[]> {
  const points: WakafPoint[] = [];
  let offset = 0;

  for (let i = 0; i < MAX_HALAMAN; i++) {
    const url =
      `${WAKAF_BASE_URL}/${layerId}/query?where=1%3D1&outFields=OBJECTID` +
      `&returnGeometry=true&f=geojson&resultRecordCount=${SAIZ_HALAMAN}&resultOffset=${offset}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) break;

    const data = (await res.json()) as {
      features?: Array<{ properties?: { OBJECTID?: number }; geometry?: { coordinates?: [number, number] } }>;
      exceededTransferLimit?: boolean;
    };
    const features = data.features ?? [];

    for (const f of features) {
      const coords = f.geometry?.coordinates;
      if (Array.isArray(coords) && coords.length === 2) {
        points.push({ id: f.properties?.OBJECTID ?? points.length, lat: coords[1], lng: coords[0] });
      }
    }

    if (!data.exceededTransferLimit || features.length === 0) break;
    offset += SAIZ_HALAMAN;
  }

  return points;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("negeri") ?? "";
  const negeri = cariNegeriWakaf(slug);

  if (!negeri) {
    return NextResponse.json({
      negeri: null,
      agensi: null,
      jenis: null,
      points: [],
      senaraiNegeri: WAKAF_NEGERI.map((n) => ({
        slug: n.slug,
        label: n.label,
        agensi: n.agensi,
        adaSediaAda: Boolean(n.layers.sedia_ada),
      })),
      fetchedAt: new Date().toISOString(),
      source: "MyGeoportal (JUPEM)",
      error: slug ? "Negeri tidak disokong." : undefined,
    });
  }

  const jenis: "sedia_ada" | "cadangan" = negeri.layers.sedia_ada ? "sedia_ada" : "cadangan";
  const layerId = negeri.layers[jenis]!;
  const cached = cache.get(slug);
  const isStale = !cached || Date.now() - new Date(cached.fetchedAt).getTime() > CACHE_MS;

  if (isStale) {
    try {
      const points = await ambilLayer(layerId);
      if (points.length > 0 || !cached) {
        cache.set(slug, { points, jenis, fetchedAt: new Date().toISOString() });
      }
    } catch {
      // biarkan cache sedia ada (jika ada) kekal
    }
  }

  const entry = cache.get(slug);

  return NextResponse.json({
    negeri: negeri.label,
    agensi: negeri.agensi,
    jenis: entry?.jenis ?? jenis,
    points: entry?.points ?? [],
    senaraiNegeri: WAKAF_NEGERI.map((n) => ({
      slug: n.slug,
      label: n.label,
      agensi: n.agensi,
      adaSediaAda: Boolean(n.layers.sedia_ada),
    })),
    fetchedAt: entry?.fetchedAt ?? new Date().toISOString(),
    source: "MyGeoportal / Jabatan Ukur dan Pemetaan Malaysia (JUPEM)",
    error: !entry ? "Gagal mendapatkan data daripada MyGeoportal. Sila cuba lagi sebentar." : undefined,
  });
}
