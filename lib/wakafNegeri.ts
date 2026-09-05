// Mapping negeri -> layer ArcGIS REST rasmi MyGeoportal (JUPEM), servis
// "Tanah_Wakaf_Public". Disahkan terus daripada MapServer?f=json pada 2026-09-06.
// "sedia_ada" = lokasi tanah wakaf berdaftar; "cadangan" = cadangan pembangunan
// projek atas tanah wakaf (bukan lokasi tanah sedia ada).
export const WAKAF_BASE_URL =
  "https://mygos.mygeoportal.gov.my/gisserver/rest/services/Tanah_wakaf/Tanah_Wakaf_Public/MapServer";

export type JenisLayerWakaf = "sedia_ada" | "cadangan";

export type NegeriWakaf = {
  slug: string;
  label: string;
  agensi: string;
  layers: Partial<Record<JenisLayerWakaf, number>>;
};

export const WAKAF_NEGERI: NegeriWakaf[] = [
  { slug: "selangor", label: "Selangor", agensi: "MAIS", layers: { sedia_ada: 30, cadangan: 31 } },
  { slug: "melaka", label: "Melaka", agensi: "MAIM", layers: { sedia_ada: 3, cadangan: 4 } },
  { slug: "sabah", label: "Sabah", agensi: "JHEAINS", layers: { sedia_ada: 6, cadangan: 7 } },
  { slug: "perak", label: "Perak", agensi: "MAIPk", layers: { sedia_ada: 9, cadangan: 10 } },
  { slug: "terengganu", label: "Terengganu", agensi: "MAIDAM", layers: { sedia_ada: 12, cadangan: 13 } },
  { slug: "johor", label: "Johor", agensi: "MAIJ", layers: { sedia_ada: 15, cadangan: 16 } },
  { slug: "kedah", label: "Kedah", agensi: "MAIK", layers: { cadangan: 19 } },
  { slug: "kelantan", label: "Kelantan", agensi: "MAIN Kelantan", layers: { sedia_ada: 21, cadangan: 22 } },
  { slug: "pulau-pinang", label: "Pulau Pinang", agensi: "MAINPP", layers: { sedia_ada: 24, cadangan: 25 } },
  { slug: "negeri-sembilan", label: "Negeri Sembilan", agensi: "MAINS", layers: { cadangan: 28 } },
  { slug: "wp-kuala-lumpur", label: "WP Kuala Lumpur", agensi: "MAIWP", layers: { cadangan: 34 } },
  { slug: "pahang", label: "Pahang", agensi: "MUIP", layers: { sedia_ada: 36, cadangan: 37 } },
  { slug: "perlis", label: "Perlis", agensi: "MAIPs", layers: { sedia_ada: 39, cadangan: 40 } },
  { slug: "sarawak", label: "Sarawak", agensi: "Majlis Islam Sarawak (MIS)", layers: { sedia_ada: 42, cadangan: 43 } },
];

export function cariNegeriWakaf(slug: string): NegeriWakaf | undefined {
  return WAKAF_NEGERI.find((n) => n.slug === slug);
}
