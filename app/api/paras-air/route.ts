export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import stesenLookup from "@/lib/data/stesen-aras-air.json";

type Lookup = Record<string, { name: string; state: string; lat: number; lng: number }>;
const STESEN: Lookup = stesenLookup as Lookup;

const NEGERI: { code: string; label: string }[] = [
  { code: "PLS", label: "Perlis" },
  { code: "KDH", label: "Kedah" },
  { code: "PNG", label: "Pulau Pinang" },
  { code: "PRK", label: "Perak" },
  { code: "SEL", label: "Selangor" },
  { code: "WLH", label: "WP Kuala Lumpur" },
  { code: "PTJ", label: "WP Putrajaya" },
  { code: "NSN", label: "Negeri Sembilan" },
  { code: "MLK", label: "Melaka" },
  { code: "JHR", label: "Johor" },
  { code: "PHG", label: "Pahang" },
  { code: "TRG", label: "Terengganu" },
  { code: "KEL", label: "Kelantan" },
  { code: "SRK", label: "Sarawak" },
  { code: "SAB", label: "Sabah" },
  { code: "WLP", label: "WP Labuan" },
];

export type StesenAir = {
  id: string;
  name: string;
  district: string;
  negeri: string;
  lat: number;
  lng: number;
  level: number | null;
  normal: number;
  alert: number;
  warning: number;
  danger: number;
  lastUpdate: string;
  status: "normal" | "waspada" | "amaran" | "bahaya" | "tiada_data";
};

function statusOf(level: number | null, alert: number, warning: number, danger: number): StesenAir["status"] {
  if (level === null || level <= 0) return "tiada_data";
  if (level >= danger) return "bahaya";
  if (level >= warning) return "amaran";
  if (level >= alert) return "waspada";
  return "normal";
}

function parseNumber(text: string): number {
  const n = parseFloat(text.replace(/,/g, "").trim());
  return Number.isNaN(n) ? 0 : n;
}

async function fetchNegeri(code: string, label: string): Promise<StesenAir[]> {
  const url = `https://publicinfobanjir.water.gov.my/aras-air/data-paras-air/aras-air-data/?state=${code}&district=ALL&station=ALL`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = cheerio.load(html);

    const rows: StesenAir[] = [];
    $("tr.item").each((_, el) => {
      const $row = $(el);
      const id = $row.find("td[data-th='Station ID']").text().trim();
      const name = $row.find("td[data-th='Station Name']").text().trim();
      const district = $row.find("td[data-th='District']").text().trim();
      const lastUpdate = $row.find("td[data-th='Last Update']").text().trim();
      const levelText = $row.find("td[data-th='wl']").text().trim();
      const normal = parseNumber($row.find("td[data-th='Normal']").text());
      const alert = parseNumber($row.find("td[data-th='Alert']").text());
      const warning = parseNumber($row.find("td[data-th='Warning']").text());
      const danger = parseNumber($row.find("td[data-th='Danger']").text());

      const koordinat = STESEN[id];
      if (!koordinat) return;

      const level = levelText ? parseNumber(levelText) : null;

      rows.push({
        id,
        name: name || koordinat.name,
        district,
        negeri: label,
        lat: koordinat.lat,
        lng: koordinat.lng,
        level,
        normal,
        alert,
        warning,
        danger,
        lastUpdate,
        status: statusOf(level, alert, warning, danger),
      });
    });

    return rows;
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

let cache: { data: StesenAir[]; fetchedAt: string } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export async function GET() {
  const isStale = !cache || Date.now() - new Date(cache.fetchedAt).getTime() > CACHE_MS;

  if (isStale) {
    const results = await Promise.all(NEGERI.map((n) => fetchNegeri(n.code, n.label)));
    const byId = new Map<string, StesenAir>();
    for (const s of results.flat()) {
      if (!byId.has(s.id)) byId.set(s.id, s);
    }
    const stations = Array.from(byId.values());

    if (stations.length > 0 || !cache) {
      cache = { data: stations, fetchedAt: new Date().toISOString() };
    }
  }

  return NextResponse.json({
    stations: cache?.data ?? [],
    fetchedAt: cache?.fetchedAt ?? new Date().toISOString(),
    source: "Jabatan Pengairan dan Saliran (Public InfoBanjir)",
    error: cache && cache.data.length === 0 ? "Gagal mendapatkan data paras air terkini. Sila cuba lagi sebentar." : undefined,
  });
}
