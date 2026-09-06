"use client";

import { Suspense } from "react";
import SemakKeahlianContent from "@/components/keahlian/SemakKeahlianContent";

export default function SemakKeahlianPage() {
  return (
    <Suspense fallback={null}>
      <SemakKeahlianContent />
    </Suspense>
  );
}
