// Rujuk dokumentasi rasmi: https://developers.easyparcel.com
// Base URL production: https://connect.easyparcel.my/
// Base URL demo/sandbox: http://demo.connect.easyparcel.my/

const EASYPARCEL_BASE_URL =
  process.env.EASYPARCEL_SANDBOX === "true"
    ? "http://demo.connect.easyparcel.my/"
    : "https://connect.easyparcel.my/";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_API_KEY!;

// Kurier pilihan utama & kedua secara default untuk semua order - checkout
// akan cuba SPX dulu, kalau tak tersedia untuk destinasi tertentu cuba J&T.
// Guna checkEasyParcelRate({ strict: true }) untuk elak fallback senyap kepada
// kurier lain (lihat lib/pricing.ts calculateShipping).
export const DEFAULT_PREFERRED_COURIER = "SPX Xpress (Malaysia) Sdn Bhd";
export const SECONDARY_PREFERRED_COURIER = "J&T Express (Malaysia) Sdn. Bhd.";

// Maklumat penghantar (PLT) - diisi dalam .env
const SENDER = {
  name: process.env.EASYPARCEL_SENDER_NAME || "Pertubuhan Literasi Tanah",
  phone: process.env.EASYPARCEL_SENDER_PHONE || "",
  address: process.env.EASYPARCEL_SENDER_ADDRESS || "",
  postcode: process.env.EASYPARCEL_SENDER_POSTCODE || "",
  city: process.env.EASYPARCEL_SENDER_CITY || "",
  state: process.env.EASYPARCEL_SENDER_STATE || "", // cth: "Selangor"
};

type RateCheckParams = {
  destPostcode: string;
  destState: string;
  weightKg: number;
  // Kalau diisi, cuba cari kurier yang SAMA dulu (supaya konsisten dengan
  // apa yang customer nampak/bayar masa checkout) - kalau tak jumpa,
  // fallback kepada kadar termurah yang tersedia (kecuali `strict: true`).
  preferCourierName?: string | null;
  // Kalau true DAN preferCourierName tak dijumpai dalam kadar yang tersedia,
  // pulangkan null terus (JANGAN fallback ke kadar termurah). Guna ni untuk
  // senarai kurier keutamaan berperingkat (cth: cuba SPX -> cuba J&T -> manual).
  strict?: boolean;
};

type RateResult = {
  rateId: string;
  serviceId: string;
  courierName: string;
  priceSen: number;
};

async function fetchEasyParcelRates(destPostcode: string, destState: string, weightKg: number): Promise<any[]> {
  const form = new URLSearchParams();
  form.set("api", EASYPARCEL_API_KEY);
  form.set("bulk[0][pick_code]", SENDER.postcode);
  form.set("bulk[0][pick_state]", SENDER.state);
  form.set("bulk[0][pick_country]", "MY");
  form.set("bulk[0][send_code]", destPostcode);
  form.set("bulk[0][send_state]", destState);
  form.set("bulk[0][send_country]", "MY");
  form.set("bulk[0][weight]", String(weightKg));

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPRateCheckingBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  return data?.result?.[0]?.rates ?? [];
}

/**
 * Semak kadar penghantaran (rate checking) sebelum tempah - digunakan bila
 * produk mode "BERAT" (bukan kadar tetap).
 */
export async function checkEasyParcelRate(params: RateCheckParams): Promise<RateResult | null> {
  const rates = await fetchEasyParcelRates(params.destPostcode, params.destState, params.weightKg);
  if (rates.length === 0) return null;

  let chosen = params.preferCourierName
    ? rates.find((r: any) => r.courier_name === params.preferCourierName)
    : undefined;

  if (!chosen) {
    if (params.strict) return null;
    // Ambil kadar TERMURAH yang tersedia
    chosen = rates.reduce((a: any, b: any) => (parseFloat(a.price) < parseFloat(b.price) ? a : b));
  }

  return {
    rateId: chosen.rate_id,
    serviceId: chosen.service_id,
    courierName: chosen.courier_name,
    priceSen: Math.round(parseFloat(chosen.price) * 100),
  };
}

/**
 * Senaraikan SEMUA kadar/kurier tersedia untuk destinasi tertentu (susun
 * termurah dulu) - digunakan oleh admin untuk pilih kurier secara manual bila
 * SPX & J&T dua-dua tak tersedia (order ditanda `manualCourier`).
 */
export async function listEasyParcelRates(params: {
  destPostcode: string;
  destState: string;
  weightKg: number;
}): Promise<RateResult[]> {
  const rates = await fetchEasyParcelRates(params.destPostcode, params.destState, params.weightKg);
  return rates
    .map((r: any) => ({
      rateId: r.rate_id,
      serviceId: r.service_id,
      courierName: r.courier_name,
      priceSen: Math.round(parseFloat(r.price) * 100),
    }))
    .sort((a, b) => a.priceSen - b.priceSen);
}

type SubmitOrderParams = {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  receiverPostcode: string;
  receiverCity: string;
  receiverState: string;
  weightKg: number;
  serviceId: string;
  content: string; // penerangan ringkas kandungan bungkusan
  valueRM: number; // nilai barang (untuk insurans/kastam)
};

type OrderBookingResult = {
  success: boolean;
  orderNo: string | null;
  trackingNumber: string | null;
  courierName: string | null;
  awbUrl: string | null;
  errorMessage: string | null;
  rawDebug: string;
  raw: any;
};

/**
 * Cari pautan PDF label AWB dalam respons EasyParcel - nama field TAK
 * disahkan 100% (dokumentasi rasmi tak bagi contoh JSON penuh), jadi kita
 * cuba beberapa nama field biasa digunakan oleh integrasi EasyParcel lain
 * (plugin WooCommerce/WHMCS). Kalau tiada yang match, staff kena semak
 * terus dalam dashboard EasyParcel dan cetak dari sana secara manual.
 */
function extractAwbUrl(result: any, parcel: any): string | null {
  return (
    parcel?.awb_id_link ??
    parcel?.awb_link ??
    parcel?.label_link ??
    parcel?.awb_url ??
    result?.awb_id_link ??
    result?.awb_link ??
    null
  );
}

/**
 * Tempah penghantaran sebenar dengan EasyParcel selepas bayaran berjaya.
 * NOTA: Nama medan tepat untuk "Submit Order" mungkin berbeza sedikit ikut
 * jenis akaun (Individual API vs Marketplace API) - sila sahkan dengan
 * dokumentasi/support EasyParcel jika ada error, dan sesuaikan medan di bawah.
 *
 * PENTING - kenapa tracking number selalunya TIADA dalam respons endpoint
 * ni: ikut aliran rasmi EasyParcel, EPSubmitOrderBulk hanya CIPTA order
 * (dapat order_number), AWB/tracking number cuma di-generate SELEPAS order
 * tu dibayar melalui EPPayOrderBulk (guna baki kredit akaun). Sebab tu
 * dulu order jadi "berjaya" dalam dashboard EasyParcel (order dah wujud)
 * tapi sistem kita anggap "gagal" (tiada tracking). Fungsi payEasyParcelOrder
 * di bawah address benda ni - jangan retry submitEasyParcelOrder untuk order
 * yang dah ada order_number, sebaliknya panggil payEasyParcelOrder.
 */
export async function submitEasyParcelOrder(params: SubmitOrderParams): Promise<OrderBookingResult> {
  const form = new URLSearchParams();
  form.set("api", EASYPARCEL_API_KEY);
  form.set("bulk[0][pick_name]", SENDER.name);
  form.set("bulk[0][pick_contact]", SENDER.phone);
  form.set("bulk[0][pick_addr1]", SENDER.address);
  form.set("bulk[0][pick_city]", SENDER.city);
  form.set("bulk[0][pick_state]", SENDER.state);
  form.set("bulk[0][pick_code]", SENDER.postcode);
  form.set("bulk[0][pick_country]", "MY");

  form.set("bulk[0][send_name]", params.receiverName);
  form.set("bulk[0][send_contact]", params.receiverPhone);
  form.set("bulk[0][send_addr1]", params.receiverAddress);
  form.set("bulk[0][send_city]", params.receiverCity);
  form.set("bulk[0][send_state]", params.receiverState);
  form.set("bulk[0][send_code]", params.receiverPostcode);
  form.set("bulk[0][send_country]", "MY");

  form.set("bulk[0][weight]", String(params.weightKg));
  form.set("bulk[0][content]", params.content);
  form.set("bulk[0][value]", String(params.valueRM));
  form.set("bulk[0][service_id]", params.serviceId);

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPSubmitOrderBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();

  // DEBUG: log respons PENUH ke Vercel function logs supaya boleh disahkan
  // struktur field sebenar EasyParcel (nama field "status"/"parcel"/"awb"
  // dsb dalam kod ni tekaan asal berdasarkan dokumentasi umum - belum
  // disahkan 100% dengan akaun sebenar Tuan).
  console.log("[EasyParcel] EPSubmitOrderBulk raw response:", JSON.stringify(data));

  const result = data?.result?.[0];
  const parcel = result?.parcel?.[0];

  // EasyParcel pulangkan sebab kegagalan (cth: baki akaun tak cukup, alamat
  // tak sah, dll) - ATAU mesej BERJAYA - dalam pelbagai medan berbeza ikut
  // jenis respons. Kita simpan apa yang ada supaya boleh dipaparkan.
  const remarks: string | null =
    result?.remarks ||
    result?.reason ||
    parcel?.remarks ||
    parcel?.reason ||
    data?.error?.message ||
    data?.error_remark ||
    (typeof data?.error === "string" ? data.error : null) ||
    null;

  // Terima pelbagai kemungkinan ejaan/case untuk status "berjaya", sebab
  // kita tak pasti 100% format tepat akaun Tuan.
  const statusRaw = String(result?.status ?? "").toLowerCase();
  const looksSuccessful =
    statusRaw === "success" || statusRaw === "1" || statusRaw === "true" || statusRaw === "ok";

  const trackingNumber =
    parcel?.awb ?? parcel?.tracking_number ?? parcel?.awb_no ?? result?.awb ?? result?.tracking_number ?? null;

  return {
    success: looksSuccessful,
    orderNo: result?.order_number ?? result?.order_no ?? null,
    trackingNumber,
    courierName: parcel?.courier ?? parcel?.courier_name ?? null,
    awbUrl: extractAwbUrl(result, parcel),
    errorMessage: remarks,
    // Sertakan sekeping respons mentah supaya admin nampak terus dalam
    // dashboard - buang bila dah pasti field mapping betul.
    rawDebug: JSON.stringify(result ?? data).slice(0, 500),
    raw: result,
  };
}

/**
 * Bayar order yang DAH WUJUD di EasyParcel (guna order_number daripada
 * EPSubmitOrderBulk), untuk generate AWB/tracking number.
 *
 * Ikut aliran rasmi EasyParcel: Rate Check -> Submit Order -> PAY Order ->
 * (AWB di-generate) -> Track. EPSubmitOrderBulk sendiri TIDAK menghasilkan
 * AWB - order kekal "belum bayar" sampai EPPayOrderBulk dipanggil (guna
 * baki kredit akaun EasyParcel Tuan).
 *
 * SELAMAT untuk dipanggil selepas submit berjaya - fungsi ni TIDAK cipta
 * order baru (jadi tiada risiko booking berganda), ia cuma proses bayaran
 * untuk order_number yang sedia ada.
 *
 * NOTA: macam submitEasyParcelOrder, nama medan request/response endpoint
 * ni (bulk[0][order_no], struktur result[0].parcel[0].awb, dll) berdasarkan
 * corak yang sama macam EPSubmitOrderBulk/EPRateCheckingBulk dalam akaun
 * Tuan - BELUM disahkan 100% sebab dokumentasi rasmi EasyParcel tak
 * senaraikan contoh JSON penuh secara terbuka. Kalau field tak match lepas
 * cuba kali pertama, semak log "[EasyParcel] EPPayOrderBulk raw response"
 * dalam Vercel function logs dan sesuaikan mapping di bawah.
 */
export async function payEasyParcelOrder(orderNo: string): Promise<OrderBookingResult> {
  const form = new URLSearchParams();
  form.set("api", EASYPARCEL_API_KEY);
  form.set("bulk[0][order_no]", orderNo);

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPPayOrderBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();

  // DEBUG: sila semak log ni dulu kalau tracking masih tak masuk lepas
  // guna fungsi ni - untuk sahkan nama field sebenar respons akaun Tuan.
  console.log("[EasyParcel] EPPayOrderBulk raw response:", JSON.stringify(data));

  const result = data?.result?.[0];
  const parcel = result?.parcel?.[0];

  const remarks: string | null =
    result?.remarks ||
    result?.reason ||
    parcel?.remarks ||
    parcel?.reason ||
    data?.error?.message ||
    data?.error_remark ||
    (typeof data?.error === "string" ? data.error : null) ||
    null;

  const statusRaw = String(result?.status ?? result?.messagenow ?? "").toLowerCase();
  const looksSuccessful =
    statusRaw === "success" ||
    statusRaw === "1" ||
    statusRaw === "true" ||
    statusRaw === "ok" ||
    statusRaw === "fully paid" ||
    statusRaw.includes("paid");

  const trackingNumber =
    parcel?.awb ?? parcel?.tracking_number ?? parcel?.awb_no ?? result?.awb ?? result?.tracking_number ?? null;

  return {
    success: looksSuccessful,
    orderNo: result?.order_number ?? result?.order_no ?? orderNo,
    trackingNumber,
    courierName: parcel?.courier ?? parcel?.courier_name ?? null,
    awbUrl: extractAwbUrl(result, parcel),
    errorMessage: remarks,
    rawDebug: JSON.stringify(result ?? data).slice(0, 500),
    raw: result,
  };
}

type AwbLookupResult = {
  awbUrl: string | null;
  shipStatus: string | null;
  rawDebug: string;
};

/**
 * Tarik pautan PDF AWB sebenar guna nombor tracking (AWB) - endpoint
 * EPOrderStatusBulk/EPPayOrderBulk pada akaun ni TIDAK pulangkan pautan AWB
 * (disahkan bila diuji terus), tapi EPParcelStatusBulk (guna awb_no) ADA
 * pulangkan field "awb_id_link". Guna fungsi ni untuk backfill awbUrl bila
 * order dah ada trackingNumber tapi awbUrl masih kosong.
 */
export async function fetchEasyParcelAwbLink(awbNo: string): Promise<AwbLookupResult> {
  const form = new URLSearchParams();
  form.set("api", EASYPARCEL_API_KEY);
  form.set("bulk[0][awb_no]", awbNo);

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPParcelStatusBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  console.log("[EasyParcel] EPParcelStatusBulk raw response:", JSON.stringify(data));

  const result = data?.result?.[0];
  const parcel = result?.parcel?.[0];

  return {
    awbUrl: parcel?.awb_id_link ?? null,
    shipStatus: parcel?.ship_status ?? null,
    rawDebug: JSON.stringify(result ?? data).slice(0, 500),
  };
}

/**
 * Fallback: semak status order sedia ada di EasyParcel (guna order_number)
 * untuk tarik AWB/tracking number bila ia belum siap serta-merta lepas
 * EPPayOrderBulk (sesetengah kurier assign AWB dengan sedikit lengah).
 *
 * Tak cipta order baru dan tak proses bayaran - selamat untuk dipanggil
 * berulang kali (contoh: guna cron/retry ringan) sementara tunggu AWB siap.
 *
 * NOTA: sama macam fungsi lain di atas, field mapping endpoint status
 * (EPOrderStatusBulk) BELUM disahkan 100% - semak log raw response kalau
 * tak match.
 */
export async function checkEasyParcelOrderStatus(orderNo: string): Promise<OrderBookingResult> {
  const form = new URLSearchParams();
  form.set("api", EASYPARCEL_API_KEY);
  form.set("bulk[0][order_no]", orderNo);

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPOrderStatusBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();

  console.log("[EasyParcel] EPOrderStatusBulk raw response:", JSON.stringify(data));

  const result = data?.result?.[0];
  const parcel = result?.parcel?.[0];

  const remarks: string | null =
    result?.remarks ||
    result?.reason ||
    parcel?.remarks ||
    parcel?.reason ||
    data?.error?.message ||
    data?.error_remark ||
    (typeof data?.error === "string" ? data.error : null) ||
    null;

  const trackingNumber =
    parcel?.awb ?? parcel?.tracking_number ?? parcel?.awb_no ?? result?.awb ?? result?.tracking_number ?? null;

  return {
    success: Boolean(trackingNumber),
    orderNo: result?.order_number ?? result?.order_no ?? orderNo,
    trackingNumber,
    courierName: parcel?.courier ?? parcel?.courier_name ?? null,
    awbUrl: extractAwbUrl(result, parcel),
    errorMessage: remarks,
    rawDebug: JSON.stringify(result ?? data).slice(0, 500),
    raw: result,
  };
}
