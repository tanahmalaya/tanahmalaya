// Domain berasingan untuk laman GERAN sahaja - lihat middleware.ts.
// Fail ini bebas dari Node/Edge-specific API supaya boleh diguna dalam
// middleware (Edge runtime) mahupun Server Component (lib/isGeranRequest.ts).
export const GERAN_DOMAINS = ["gerantanah.com", "www.gerantanah.com"];

export function isGeranHostname(hostname: string) {
  return GERAN_DOMAINS.includes(hostname);
}
