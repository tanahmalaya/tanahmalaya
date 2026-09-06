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
export const BAYARCASH_PORTAL_PROGRAM = process.env.BAYARCASH_PORTAL_KEY_PROGRAM || process.env.BAYARCASH_PORTAL_KEY_KEAHLIAN!;
export const BAYARCASH_PORTAL_SUMBANGAN = process.env.BAYARCASH_PORTAL_KEY_SUMBANGAN || process.env.BAYARCASH_PORTAL_KEY_KEAHLIAN!;

type CreatePaymentIntentParams = {
  portalKey: string;
  orderId: string;
  amountSen: number; // jumlah dalam sen
  payerName: string;
  payerEmail: string;
  payerPhone: string;
  description: string;
  returnPath: string; // cth: "/keahlian/berjaya" atau "/merchandise/berjaya"
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
    return_url: `${process.env.NEXT_PUBLIC_SITE_URL}${params.returnPath}`,
    callback_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/bayarcash/callback`,
  };

  // Nota: checksum PILIHAN mengikut dokumentasi rasmi BayarCash, dibuang
  // buat sementara sebab algoritma tepat tak dapat disahkan sepenuhnya.
  // Boleh ditambah semula kemudian selepas sahkan dengan BayarCash support.

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

// Status transaksi BayarCash (field "status" dalam response API & callback).
export const BAYARCASH_STATUS = {
  NEW: 0,
  PENDING: 1,
  FAILED: 2,
  SUCCESS: 3,
  CANCELLED: 4,
} as const;

export type BayarcashTransaction = {
  id: string; // cth: trx_q6LJdl
  order_number: string;
  status: number;
  status_description: string;
  datetime: string;
  amount: number;
};

/**
 * Tarik SEMUA transaksi BayarCash untuk satu order_number terus dari API
 * mereka (bukan bergantung webhook semata-mata) - guna untuk "resync" bila
 * webhook tak sampai/hilang, atau bila pelanggan buat >1 percubaan bayaran
 * untuk order yang sama (percubaan pertama gagal, kedua berjaya - webhook
 * gagal cuma simpan SATU transaction_id terakhir, jadi kita kena tanya
 * BayarCash terus untuk dapatkan SEMUA percubaan bagi order ni).
 */
export async function getBayarcashTransactionsByOrder(orderNumber: string): Promise<BayarcashTransaction[]> {
  const res = await fetch(
    `${BAYARCASH_API_URL}/transactions?order_number=${encodeURIComponent(orderNumber)}`,
    {
      headers: {
        Authorization: `Bearer ${BAYARCASH_PAT}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`BayarCash error: ${res.status} ${await res.text()}`);
  }

  const json = (await res.json()) as { data: BayarcashTransaction[] };
  return json.data || [];
}

/**
 * Antara semua percubaan bayaran (transaksi) untuk satu order, pilih SATU
 * yang paling relevan untuk tentukan status order: keutamaan pertama transaksi
 * yang BERJAYA (status 3, walaupun bukan yang terkini - contoh percubaan
 * pertama gagal, kedua berjaya), kalau tiada yang berjaya baru ambil transaksi
 * paling terkini (ikut datetime) untuk tentukan sebab gagal/menunggu.
 */
export function pickRelevantBayarcashTransaction(transactions: BayarcashTransaction[]): BayarcashTransaction | null {
  if (transactions.length === 0) return null;
  const success = transactions.find((t) => t.status === BAYARCASH_STATUS.SUCCESS);
  if (success) return success;
  return [...transactions].sort((a, b) => (a.datetime < b.datetime ? 1 : -1))[0];
}
