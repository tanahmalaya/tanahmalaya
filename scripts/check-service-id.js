// Semak service_id EasyParcel yang sah untuk destinasi tertentu.
// Guna hasil ni untuk isi EASYPARCEL_DEFAULT_SERVICE_ID dalam .env
// (untuk produk mod penghantaran "FLAT"/kadar tetap).
//
// Cara guna (dari root project, .env kena ada EASYPARCEL_API_KEY dll):
//   node --env-file=.env scripts/check-service-id.js <poskod> <negeri> <beratKg>
// Contoh:
//   node --env-file=.env scripts/check-service-id.js 47100 Selangor 1

const EASYPARCEL_BASE_URL =
  process.env.EASYPARCEL_SANDBOX === "true"
    ? "http://demo.connect.easyparcel.my/"
    : "https://connect.easyparcel.my/";

async function main() {
  const [, , poskod, negeri, beratArg] = process.argv;
  if (!poskod || !negeri) {
    console.error("Guna: node --env-file=.env scripts/check-service-id.js <poskod> <negeri> [beratKg]");
    process.exit(1);
  }
  const weightKg = beratArg ? parseFloat(beratArg) : 1;

  if (!process.env.EASYPARCEL_API_KEY) {
    console.error("EASYPARCEL_API_KEY tak jumpa - pastikan run dengan --env-file=.env");
    process.exit(1);
  }

  const form = new URLSearchParams();
  form.set("api", process.env.EASYPARCEL_API_KEY);
  form.set("bulk[0][pick_code]", process.env.EASYPARCEL_SENDER_POSTCODE || "");
  form.set("bulk[0][pick_state]", process.env.EASYPARCEL_SENDER_STATE || "");
  form.set("bulk[0][pick_country]", "MY");
  form.set("bulk[0][send_code]", poskod);
  form.set("bulk[0][send_state]", negeri);
  form.set("bulk[0][send_country]", "MY");
  form.set("bulk[0][weight]", String(weightKg));

  console.log(`Menyemak kadar dari ${process.env.EASYPARCEL_SENDER_POSTCODE} (${process.env.EASYPARCEL_SENDER_STATE}) ke ${poskod} (${negeri}), berat ${weightKg}kg...`);
  console.log(`Endpoint: ${EASYPARCEL_BASE_URL} (${process.env.EASYPARCEL_SANDBOX === "true" ? "SANDBOX" : "LIVE"})\n`);

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPRateCheckingBulk`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  const rates = data?.result?.[0]?.rates;

  if (!rates || rates.length === 0) {
    console.log("Tiada kadar dipulangkan. Raw response:");
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  console.log("Kurier tersedia:\n");
  for (const r of rates) {
    console.log(`  service_id: ${r.service_id}`);
    console.log(`  kurier:     ${r.courier_name}`);
    console.log(`  harga:      RM${r.price}`);
    console.log("  ---");
  }
  console.log("\nSalin service_id kurier pilihan Tuan ke EASYPARCEL_DEFAULT_SERVICE_ID dalam .env");
}

main().catch((e) => {
  console.error("Ralat:", e.message);
  process.exit(1);
});
