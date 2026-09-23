// Struktur menu sidebar LANDHUB (admin GERAN). Satu sumber untuk sidebar
// desktop, laci mobile dan halaman "coming soon" - supaya tajuk halaman
// placeholder sentiasa sama dengan label menu yang admin klik.
//
// `ikon` ialah nama ikon lucide-react; komponen sidebar yang petakan nama ke
// komponen supaya fail ni kekal boleh diimport dari Server Component.

export type LandhubIcon =
  | "dashboard"
  | "land"
  | "map"
  | "media"
  | "prospects"
  | "consultants"
  | "documents"
  | "transactions"
  | "reports"
  | "settings";

export type LandhubNavChild = {
  href: string;
  label: string;
  // Kunci kiraan lencana dalam LandhubCounts - kosong = tiada lencana.
  countKey?: keyof LandhubCounts;
};

export type LandhubNavItem = {
  href: string;
  label: string;
  icon: LandhubIcon;
  children?: LandhubNavChild[];
};

export type LandhubCounts = {
  draft: number;
  pending: number;
  active: number;
  sold: number;
};

export const LANDHUB_NAV: LandhubNavItem[] = [
  { href: "/geran/admin", label: "Dashboard", icon: "dashboard" },
  {
    href: "/geran/admin/geran",
    label: "Land",
    icon: "land",
    children: [
      { href: "/geran/admin/geran", label: "All Land" },
      { href: "/geran/admin/geran?status=draft", label: "Draft", countKey: "draft" },
      { href: "/geran/admin/geran?status=pending", label: "Pending Review", countKey: "pending" },
      { href: "/geran/admin/geran?status=active", label: "Active", countKey: "active" },
      { href: "/geran/admin/geran?status=sold", label: "Sold", countKey: "sold" },
      { href: "/geran/admin/geran?status=archived", label: "Archived" },
    ],
  },
  {
    href: "/geran/admin/lots",
    label: "Lots & Map",
    icon: "map",
    children: [
      { href: "/geran/admin/lots/map", label: "Lot Map" },
      { href: "/geran/admin/lots/marking", label: "Lot Marking" },
      { href: "/geran/admin/lots/gis", label: "GIS" },
    ],
  },
  {
    href: "/geran/admin/media",
    label: "Media",
    icon: "media",
    children: [
      { href: "/geran/admin/media/photos", label: "Photos" },
      { href: "/geran/admin/media/360", label: "360°" },
    ],
  },
  { href: "/geran/admin/prospects", label: "Prospects / Buyers", icon: "prospects" },
  { href: "/geran/admin/consultants", label: "Consultants", icon: "consultants" },
  { href: "/geran/admin/documents", label: "Documents", icon: "documents" },
  { href: "/geran/admin/transactions", label: "Transactions", icon: "transactions" },
  { href: "/geran/admin/reports", label: "Reports", icon: "reports" },
  { href: "/geran/admin/settings", label: "Settings", icon: "settings" },
];

// Cari label menu untuk path yang belum ada halaman sebenar - dipakai halaman
// placeholder supaya tajuknya ikut menu, bukan disalin tangan.
export function labelUntukPath(path: string): { label: string; parent: string | null } | null {
  for (const item of LANDHUB_NAV) {
    for (const child of item.children ?? []) {
      if (child.href === path) return { label: child.label, parent: item.label };
    }
    if (item.href === path) return { label: item.label, parent: null };
  }
  return null;
}
