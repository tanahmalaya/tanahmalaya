"use client";

import { Suspense } from "react";
import SemakKeahlianContent from "@/components/keahlian/SemakKeahlianContent";

export default function SemakKeahlianPltPage() {
  return (
    <Suspense fallback={null}>
      <SemakKeahlianContent expectedType="PLT" otherTypeHref="/keahlian/semak" />
    </Suspense>
  );
}
