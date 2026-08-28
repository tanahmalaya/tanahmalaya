// Rujuk dokumentasi rasmi: https://developers.easyparcel.com
// Base URL production: https://connect.easyparcel.my/
// Base URL demo/sandbox: http://demo.connect.easyparcel.my/

const EASYPARCEL_BASE_URL =
  process.env.EASYPARCEL_SANDBOX === "true"
    ? "http://demo.connect.easyparcel.my/"
    : "https://connect.easyparcel.my/";

const EASYPARCEL_API_KEY = process.env.EASYPARCEL_API_KEY!;

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
  // fallback kepada kadar termurah yang tersedia.
  preferCourierName?: string | null;
};

type RateResult = {
  rateId: string;
  serviceId: string;
  courierName: string;
  priceSen: number;
};

/**
 * Semak kadar penghantaran (rate checking) sebelum tempah - digunakan bila
 * produk mode "BERAT" (bukan kadar tetap).
 */
export async function checkEasyParcelRate(params: RateCheckParams): Promise<RateResult | null> {
  const form = new URLSearchParams();
  form.set("api", EASYPARCEL_API_KEY);
  form.set("bulk[0][pick_code]", SENDER.postcode);
  form.set("bulk[0][pick_state]", SENDER.state);
  form.set("bulk[0][pick_country]", "MY");
  form.set("bulk[0][send_code]", params.destPostcode);
  form.set("bulk[0][send_state]", params.destState);
  form.set("bulk[0][send_country]", "MY");
  form.set("bulk[0][weight]", String(params.weightKg));

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPRateCheckingBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  const rates = data?.result?.[0]?.rates;
  if (!rates || rates.length === 0) return null;

  let chosen = params.preferCourierName
    ? rates.find((r: any) => r.courier_name === params.preferCourierName)
    : undefined;

  if (!chosen) {
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

/**
 * Tempah penghantaran sebenar dengan EasyParcel selepas bayaran berjaya.
 * NOTA: Nama medan tepat untuk "Submit Order" mungkin berbeza sedikit ikut
 * jenis akaun (Individual API vs Marketplace API) - sila sahkan dengan
 * dokumentasi/support EasyParcel jika ada error, dan sesuaikan medan di bawah.
 */
export async function submitEasyParcelOrder(params: SubmitOrderParams) {
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
    errorMessage: remarks,
    // Sertakan sekeping respons mentah supaya admin nampak terus dalam
    // dashboard - buang bila dah pasti field mapping betul.
    rawDebug: JSON.stringify(result ?? data).slice(0, 500),
    raw: result,
  };
}
