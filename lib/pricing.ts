import { checkEasyParcelRate } from "@/lib/easyparcel";

export async function calculateShipping(
  product: { shippingMode: string; shippingFlatSen: number | null; beratGram: number | null },
  kuantiti: number,
  poskod: string,
  negeri: string
): Promise<{ shippingSen: number; courierName: string | null; serviceId: string | null }> {
  if (product.shippingMode === "FLAT") {
    return {
      shippingSen: product.shippingFlatSen ?? 0,
      courierName: null,
      serviceId: process.env.EASYPARCEL_DEFAULT_SERVICE_ID || null,
    };
  }

  const beratKg = ((product.beratGram ?? 500) * kuantiti) / 1000;
  const rate = await checkEasyParcelRate({ destPostcode: poskod, destState: negeri, weightKg: beratKg });

  if (rate) {
    return { shippingSen: rate.priceSen, courierName: rate.courierName, serviceId: rate.serviceId };
  }
  return { shippingSen: 0, courierName: null, serviceId: null };
}
