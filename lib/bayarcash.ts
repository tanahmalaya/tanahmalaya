import crypto from "crypto";

// TODO: Isi nilai sebenar dari portal BayarCash (Business > API Settings) dan
// letak dalam .env, JANGAN hardcode di sini.
const BAYARCASH_API_URL = "https://api.bayarcash-sandbox.com/v3"; // tukar ke production URL bila live
const BAYARCASH_API_TOKEN = process.env.BAYARCASH_API_TOKEN!;
const BAYARCASH_PORTAL_KEY = process.env.BAYARCASH_PORTAL_KEY!;
const BAYARCASH_SECRET_KEY = process.env.BAYARCASH_SECRET_KEY!;

type CreatePaymentIntentParams = {
  orderId: string;
  amountSen: number; // jumlah dalam sen
  payerName: string;
  payerEmail: string;
  description: string;
};

/**
 * Cipta payment intent BayarCash dan pulangkan URL untuk redirect pengguna
 * bayar. Rujuk dokumentasi rasmi BayarCash untuk field yang tepat -
 * struktur di bawah adalah rangka asas yang perlu disesuaikan.
 */
export async function createBayarcashPaymentIntent(params: CreatePaymentIntentParams) {
  const res = await fetch(`${BAYARCASH_API_URL}/payment-intents`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BAYARCASH_API_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      portal_key: BAYARCASH_PORTAL_KEY,
      order_number: params.orderId,
      amount: (params.amountSen / 100).toFixed(2),
      payer_name: params.payerName,
      payer_email: params.payerEmail,
      description: params.description,
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/keahlian/berjaya`,
      callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bayarcash/callback`,
    }),
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
