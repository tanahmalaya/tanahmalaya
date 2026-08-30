import { checkEasyParcelRate } from "@/lib/easyparcel";
import { validatePostcodeNegeri } from "@/lib/postcode";

// Dilempar bila poskod/negeri tak sah, atau tiada kurier boleh hantar ke
// destinasi tu - checkout patut tolak order dengan mesej ni, bukan teruskan
// dengan shipping RM0 atau alamat mengarut.
export class AlamatTidakSahError extends Error {}

export async function calculateShipping(
  product: { shippingMode: string; shippingFlatSen: number | null; beratGram: number | null },
  kuantiti: number,
  poskod: string,
  negeri: string
): Promise<{ shippingSen: number; courierName: string | null; serviceId: string | null }> {
  const check = validatePostcodeNegeri(poskod, negeri);
  if (!check.valid) {
    throw new AlamatTidakSahError(check.reason);
  }

  if (product.shippingMode === "FLAT") {
    return {
      shippingSen: product.shippingFlatSen ?? 0,
      courierName: null,
      serviceId: process.env.EASYPARCEL_DEFAULT_SERVICE_ID || null,
    };
  }

  const beratKg = ((product.beratGram ?? 500) * kuantiti) / 1000;
  const rate = await checkEasyParcelRate({ destPostcode: poskod, destState: negeri, weightKg: beratKg });

  if (!rate) {
    throw new AlamatTidakSahError(
      `Tiada kurier tersedia untuk hantar ke poskod ${poskod}. Sila semak semula alamat.`
    );
  }
  return { shippingSen: rate.priceSen, courierName: rate.courierName, serviceId: rate.serviceId };
}
