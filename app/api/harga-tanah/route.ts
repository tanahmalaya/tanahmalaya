export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const USER_AGENT = "tanahmalaya.org peta-harga-tanah (info@tanahmalaya.org)";

const LABEL_JENIS: Record<string, string> = {
  KOSONG: "Tanah Kosong",
  PEMBANGUNAN: "Tanah Pembangunan",
  PERTANIAN: "Tanah Pertanian",
};

function normalisasiDaerah(raw: string): string {
  return raw
    .replace(/^(daerah|district)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat");
  const lng = req.nextUrl.searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Sila hantar lat & lng." }, { status: 400 });
  }

  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lng);
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("zoom", "10");

    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "ms,en" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Nominatim ${res.status}`);

    const data = await res.json();
    const address = data.address ?? {};
    const negeri: string | undefined = address.state;

    // Nominatim tak konsisten: kebanyakan negeri letak nama daerah NAPIC dalam
    // "district", tapi Sabah/Sarawak (struktur Bahagian > Daerah) letak nama
    // BAHAGIAN (lebih kasar, tak match NAPIC) dalam "county"/"state_district".
    // Jadi cuba tiap calon terhadap DB, bukan tekad satu field sahaja.
    const calonDaerah = [address.district, address.county, address.city_district, address.state_district]
      .filter((v): v is string => Boolean(v))
      .map(normalisasiDaerah);

    if (calonDaerah.length === 0 || !negeri) {
      return NextResponse.json({
        daerah: null,
        negeri: negeri ?? null,
        dijumpai: false,
        items: [],
        catatan: "Tidak dapat kenal pasti daerah untuk lokasi ini.",
      });
    }

    // Ambil rekod suku TERKINI sahaja bagi setiap jenisTanah - cuba calon
    // daerah satu-satu sehingga jumpa yang ada rekod dalam DB.
    let daerah = calonDaerah[0];
    let rekod: Awaited<ReturnType<typeof prisma.napicRujukanHarga.findMany>> = [];
    for (const calon of calonDaerah) {
      const hasil = await prisma.napicRujukanHarga.findMany({
        where: { negeri, daerah: calon },
        orderBy: [{ tahun: "desc" }, { sukuan: "desc" }],
      });
      if (hasil.length > 0) {
        daerah = calon;
        rekod = hasil;
        break;
      }
    }

    if (rekod.length === 0) {
      return NextResponse.json({
        daerah,
        negeri,
        dijumpai: false,
        items: [],
        catatan: `Tiada data NAPIC untuk daerah ${daerah} lagi. Import data rasmi baru meliputi sebahagian negeri.`,
      });
    }

    const terkiniPerJenis = new Map<string, (typeof rekod)[number]>();
    for (const r of rekod) {
      if (!terkiniPerJenis.has(r.jenisTanah)) terkiniPerJenis.set(r.jenisTanah, r);
    }

    const items = [...terkiniPerJenis.values()]
      .filter((r) => r.bilangan > 0)
      .map((r) => ({
        jenisTanah: r.jenisTanah,
        label: LABEL_JENIS[r.jenisTanah] ?? r.jenisTanah,
        purataSen: Number(r.nilaiSen) / r.bilangan,
        bilangan: r.bilangan,
        tahun: r.tahun,
        sukuan: r.sukuan,
      }));

    if (items.length === 0) {
      return NextResponse.json({
        daerah,
        negeri,
        dijumpai: false,
        items: [],
        catatan: `Tiada transaksi tanah direkodkan NAPIC untuk daerah ${daerah} pada suku terkini.`,
      });
    }

    return NextResponse.json({
      daerah,
      negeri,
      dijumpai: true,
      items,
      sumber: `NAPIC - Jadual Data Transaksi Harta Tanah, ${items[0].sukuan} ${items[0].tahun}`,
    });
  } catch {
    return NextResponse.json(
      { error: "Gagal menyemak lokasi. Sila cuba lagi." },
      { status: 500 }
    );
  }
}
