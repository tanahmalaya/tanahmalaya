// One-off: isi awbUrl untuk order yang DAH ADA trackingNumber tapi awbUrl
// masih kosong (EPPayOrderBulk/EPOrderStatusBulk pada akaun ni tak pulangkan
// pautan AWB terus - kena tarik guna EPParcelStatusBulk secara berasingan).
//
// Guna: node scripts/backfill-awb.js

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const EASYPARCEL_BASE_URL =
  process.env.EASYPARCEL_SANDBOX === "true"
    ? "http://demo.connect.easyparcel.my/"
    : "https://connect.easyparcel.my/";

async function fetchAwbLink(awbNo) {
  const form = new URLSearchParams();
  form.set("api", process.env.EASYPARCEL_API_KEY);
  form.set("bulk[0][awb_no]", awbNo);

  const res = await fetch(`${EASYPARCEL_BASE_URL}?ac=EPParcelStatusBulk`, {
    method: "POST",
    body: form,
  });
  const data = await res.json();
  const parcel = data?.result?.[0]?.parcel?.[0];
  return { awbUrl: parcel?.awb_id_link ?? null, shipStatus: parcel?.ship_status ?? null };
}

async function main() {
  const orders = await prisma.order.findMany({
    where: { trackingNumber: { not: null }, awbUrl: null },
  });

  console.log(`${orders.length} order dijumpai tanpa awbUrl.`);

  for (const order of orders) {
    const { awbUrl, shipStatus } = await fetchAwbLink(order.trackingNumber);
    if (awbUrl) {
      await prisma.order.update({
        where: { id: order.id },
        data: { awbUrl, courierStatus: shipStatus, courierStatusAt: new Date() },
      });
      console.log(`Order #${order.seq}: awbUrl diisi (${shipStatus})`);
    } else {
      console.log(`Order #${order.seq}: masih tiada awb_id_link (tracking: ${order.trackingNumber})`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
