import { headers } from "next/headers";
import { isGeranHostname } from "@/lib/geran/domain";

// Guna dalam Server Component untuk kesan sama ada request datang dari
// gerantanah.com. Perlu sebab middleware rewrite tak ubah `usePathname()`
// client-side (ia kekal ikut path asal browser, bukan destinasi rewrite),
// jadi ConditionalChrome tak boleh harap pathname sahaja untuk root "/"
// gerantanah.com yang di-rewrite ke /geran.
export function isGeranDomainRequest() {
  const hostname = (headers().get("host") || "").split(":")[0];
  return isGeranHostname(hostname);
}
