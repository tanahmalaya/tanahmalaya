export const dynamic = "force-dynamic";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddLandForm from "@/components/geran/admin/AddLandForm";

export default function AddLandPage() {
  return (
    <div className="max-w-[1400px] mx-auto">
      <Link
        href="/geran/admin/geran"
        className="inline-flex items-center gap-1.5 text-sm text-black/50 hover:text-black/80 mb-3"
      >
        <ArrowLeft size={15} /> All Land
      </Link>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Add Land</h1>
      <p className="text-sm text-black/50 mt-0.5 mb-5">
        For GT&apos;s own land stock and KJ Land listings. Owner submissions arrive through the website.
      </p>
      <AddLandForm />
    </div>
  );
}
