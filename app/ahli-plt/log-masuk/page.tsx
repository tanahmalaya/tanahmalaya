import { Suspense } from "react";
import LoginAhliPltForm from "@/components/ahli-plt/LoginAhliPltForm";

export const metadata = {
  title: "Log Masuk Ahli PLT",
  robots: { index: false },
};

export default function LogMasukAhliPltPage() {
  return (
    <Suspense fallback={null}>
      <LoginAhliPltForm />
    </Suspense>
  );
}
