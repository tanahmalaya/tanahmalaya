import { Suspense } from "react";
import LoginJualTanahForm from "@/components/geran/LoginJualTanahForm";

export const metadata = {
  title: "Log Masuk Jual Tanah",
  robots: { index: false },
};

export default function LogMasukJualTanahPage() {
  return (
    <Suspense fallback={null}>
      <LoginJualTanahForm />
    </Suspense>
  );
}
