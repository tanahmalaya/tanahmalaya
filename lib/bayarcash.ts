import crypto from "crypto";

// Rujuk dokumentasi rasmi: https://docs.bayarcash.com
// Endpoint sandbox (untuk ujian): https://api.console.bayarcash-sandbox.com/v3
// Endpoint production (live, guna duit sebenar): https://api.console.bayar.cash/v3
const BAYARCASH_API_URL =
  process.env.BAYARCASH_SANDBOX === "true"
    ? "https://api.console.bayarcash-sandbox.com/v3"
    : "https://api.console.bayar.cash/v3";

// PAT = Personal Access Token (dari console.bayar.cash > Profile > Integration)
const BAYARCASH_PAT = process.env.BAYARCASH_PAT!;
const BAYARCASH_SECRET_KEY = process.env.BAYARCASH_SECRET_KEY!;

// Dua portal berasingan supaya laporan BayarCash senang diasingkan:
// satu untuk yuran keahlian, satu untuk jualan merchandise.
// Kalau Tuan cuma nak SATU portal untuk semua, isi kedua-dua env var
// ni dengan portal key yang SAMA - kod akan tetap berfungsi.
export const BAYARCASH_PORTAL_KEAHLIAN = process.env.BAYARCASH_PORTAL_KEY_KEAHLIAN!;
export const BAYARCASH_PORTAL_MERCHANDISE = process.env.BAYARCASH_PORTAL_KEY_MERCHANDISE!;

type CreatePaymentIntentParams = {
  portalKey: string;
  orderId: string;
  amountSen: number; // jumlah dalam sen
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  description: string;
};

/**
 * Cipta payment intent BayarCash dan pulangkan URL untuk redirect pengguna bayar.
 */
export async function createBayarcashPaymentIntent(params: CreatePaymentIntentParams) {
  const data: Record<string, string> = {
    portal_key: params.portalKey,
    order_number: params.orderId,
    amount: (params.amountSen / 100).toFixed(2),
    payer_name: params.payerName,
    payer_email: params.payerEmail,
    payer_telephone_number: params.payerPhone,
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/keahlian/berjaya`,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bayarcash/callback`,
  };

  // Checksum (SHA256 HMAC) - susun nilai ikut nama field secara abjad, gabung, hash
  const sortedKeys = Object.keys(data).sort();
  const message = sortedKeys.map((k) => data[k]).join("");
  data.checksum = crypto.createHmac("sha256", BAYARCASH_SECRET_KEY).update(message).digest("hex");

  const res = await fetch(`${BAYARCASH_API_URL}/payment-intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BAYARCASH_PAT}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`BayarCash error: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{ url: string; id: string }>;
}

/**
 * Sahkan signature callback dari BayarCash supaya request memang datang
 * dari BayarCash dan bukan direka oleh pihak lain.
 */
export function verifyBayarcashChecksum(payload: Record<string, string>, receivedChecksum: string) {
  const sortedKeys = Object.keys(payload).filter((k) => k !== "checksum").sort();
  const message = sortedKeys.map((k) => payload[k]).join("");
  const expected = crypto.createHmac("sha256", BAYARCASH_SECRET_KEY).update(message).digest("hex");
  return expected === receivedChecksum;
}
