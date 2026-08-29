import { redirect } from "next/navigation";

// Alias mesra-staff: tanahmalaya.org/staff -> terus ke laman log masuk
// admin/staff sebenar. Selepas log masuk, sistem (lib/auth.ts +
// app/admin/(protected)/layout.tsx) auto-tapis menu ikut peranan (STAFF
// cuma nampak "Pesanan").
export default function StaffRedirectPage() {
  redirect("/admin/login");
}
