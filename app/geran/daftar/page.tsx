import { Suspense } from "react";
import AuthGeranForm from "@/components/geran/AuthGeranForm";

export const metadata = {
  title: "Sign Up",
  robots: { index: false },
};

export default function DaftarGeranPage() {
  return (
    <Suspense fallback={null}>
      <AuthGeranForm modAwal="daftar" />
    </Suspense>
  );
}
