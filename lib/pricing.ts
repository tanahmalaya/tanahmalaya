import { checkEasyParcelRate, DEFAULT_PREFERRED_COURIER, SECONDARY_PREFERRED_COURIER } from "@/lib/easyparcel";
import { validatePostcodeNegeri } from "@/lib/postcode";

// Dilempar bila poskod/negeri tak sah - checkout patut tolak order dengan
// mesej ni, bukan teruskan dengan alamat mengarut.
export class AlamatTidakSahError extends Error {}

// Caj flat sementara bila SPX & J&T dua-dua tak tersedia untuk destinasi -
// order ditanda `manualCourier` dan staff admin akan pilih kurier sebenar +
// sahkan/betulkan caj ni secara manual dalam dashboard admin.
export const MANUAL_COURIER_FLAT_SHIPPING_SEN = 1000; // RM10.00

export async function calculateShipping(
  product: { shippingMode: string; shippingFlatSen: number | null; beratGram: number | null },
  kuantiti: number,
  poskod: string,
  negeri: string
): Promise<{ shippingSen: number; courierName: string | null; serviceId: string | null; manualCourier: boolean }> {
  const check = validatePostcodeNegeri(poskod, negeri);
  if (!check.valid) {
    throw new AlamatTidakSahError(check.reason);
  }

  if (product.shippingMode === "FLAT") {
    return {
      shippingSen: product.shippingFlatSen ?? 0,
      courierName: DEFAULT_PREFERRED_COURIER,
      serviceId: process.env.EASYPARCEL_DEFAULT_SERVICE_ID || null,
      manualCourier: false,
    };
  }

  const beratKg = ((product.beratGram ?? 500) * kuantiti) / 1000;

  // Cuba SPX dulu, kalau tak tersedia untuk destinasi ni cuba J&T - kedua-dua
  // percubaan "strict" (tiada fallback senyap ke kurier lain).
  const rate =
    (await checkEasyParcelRate({
      destPostcode: poskod,
      destState: negeri,
      weightKg: beratKg,
      preferCourierName: DEFAULT_PREFERRED_COURIER,
      strict: true,
    })) ??
    (await checkEasyParcelRate({
      destPostcode: poskod,
      destState: negeri,
      weightKg: beratKg,
      preferCourierName: SECONDARY_PREFERRED_COURIER,
      strict: true,
    }));

  if (rate) {
    return { shippingSen: rate.priceSen, courierName: rate.courierName, serviceId: rate.serviceId, manualCourier: false };
  }

  // SPX & J&T dua-dua tak tersedia untuk destinasi ni (atau EasyParcel tak
  // pulangkan sebarang kadar langsung) - jangan sekat checkout, teruskan
  // dengan caj flat sementara dan tandakan untuk semakan manual staff.
  return {
    shippingSen: MANUAL_COURIER_FLAT_SHIPPING_SEN,
    courierName: null,
    serviceId: null,
    manualCourier: true,
  };
}
