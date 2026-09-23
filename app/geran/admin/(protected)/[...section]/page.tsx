import Link from "next/link";
import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import { labelUntukPath } from "@/lib/geran/admin-nav";

// Placeholder untuk menu LANDHUB yang belum dibina (Lots & Map, Media,
// Prospects, dll). Hanya path yang wujud dalam menu dibenarkan - path lain
// tetap 404 supaya salah taip URL tak nampak macam halaman sah.
export default function LandhubComingSoonPage({ params }: { params: { section: string[] } }) {
  const path = `/geran/admin/${params.section.join("/")}`;
  const menu = labelUntukPath(path);
  if (!menu) notFound();

  return (
    <div className="max-w-[1400px] mx-auto">
      <p className="text-sm text-black/45">{menu.parent ?? "LANDHUB"}</p>
      <h1 className="font-display text-2xl font-extrabold tracking-tight mb-6">{menu.label}</h1>
      <div className="bg-white rounded-2xl border border-black/[0.06] p-10 flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
          <Construction size={22} />
        </span>
        <p className="font-bold">Coming soon</p>
        <p className="text-sm text-black/50 mt-1 max-w-sm">
          This module is part of the LANDHUB rollout and is not available yet.
        </p>
        <Link href="/geran/admin" className="mt-5 text-sm font-semibold text-emerald-700 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
