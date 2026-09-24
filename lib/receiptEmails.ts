import { sendEmail } from "@/lib/email";

const LOGO_URL = "https://tanahmalaya.org/logo-plt.jpeg";
const FONT_STACK = "'Inter', Arial, Helvetica, sans-serif";

function formatRM(sen: number) {
  return `RM ${(sen / 100).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function wrap(nama: string, bodyHtml: string) {
  return `
  <div style="background:#F5F1E9;padding:32px 16px;font-family:${FONT_STACK};color:#2A1D14;">
    <div style="max-width:520px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:20px;">
        <img src="${LOGO_URL}" width="150" alt="Pertubuhan Literasi Tanah" style="display:inline-block;" />
      </div>
      <div style="background:#FFFFFF;border-radius:12px;padding:32px 28px;box-shadow:0 1px 3px rgba(42,29,20,0.08);">
        <p style="margin-top:0;font-size:15px;">Salam sejahtera ${nama},</p>
        <div style="font-size:15px;line-height:1.6;">${bodyHtml}</div>
        <p style="margin-bottom:0;font-size:15px;">Terima kasih.<br/><strong>Pertubuhan Literasi Tanah</strong></p>
      </div>
      <p style="text-align:center;font-size:12px;color:#8B5A2B;margin-top:20px;">
        Pertubuhan Literasi Tanah &middot; tanahmalaya.org
      </p>
    </div>
  </div>`;
}

function box(rows: { label: string; value: string }[]) {
  const rowsHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:4px 0;color:#2A1D14;font-size:14px;">${r.label}</td>
        <td style="padding:4px 0;color:#C68A2E;font-size:14px;font-weight:700;text-align:right;">${r.value}</td>
      </tr>`
    )
    .join("");
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F1E9;border-left:4px solid #C68A2E;border-radius:6px;padding:6px 18px;margin:20px 0;">
    ${rowsHtml}
  </table>`;
}

// Dihantar untuk langkah ke-2 log masuk kawasan Ahli PLT (lihat
// app/api/members/login-request) - kod OTP 6-digit, sah selama
// OTP_EXPIRY_MINUTES (lib/memberAuth.ts).
export async function sendMemberLoginOtpEmail(member: { fullName: string; email: string; code: string }) {
  await sendEmail({
    to: member.email,
    subject: `Kod Log Masuk Ahli PLT: ${member.code} - Pertubuhan Literasi Tanah`,
    html: wrap(
      member.fullName,
      `<p>Guna kod di bawah untuk sahkan log masuk ke kawasan Ahli PLT (Claim, Program &amp; Kelas, Peta):</p>
       <div style="text-align:center;margin:24px 0;">
         <span style="display:inline-block;font-size:32px;font-weight:800;letter-spacing:8px;color:#C68A2E;">${member.code}</span>
       </div>
       <p>Kod ini sah selama 10 minit. Jangan kongsi kod ini dengan sesiapa.</p>
       <p style="color:#8B5A2B;font-size:13px;">Bukan anda yang mohon kod ini? Abaikan sahaja e-mel ini.</p>`
    ),
  });
}

// Dihantar bila pendaftaran keahlian berjaya bayar (Member baru dicipta,
// tapi masih MENUNGGU_SEMAKAN sehingga admin sahkan).
export async function sendMemberWelcomeEmail(member: { fullName: string; email: string; memberNo: string }) {
  await sendEmail({
    to: member.email,
    subject: "Pendaftaran Keahlian Diterima - Pertubuhan Literasi Tanah",
    html: wrap(
      member.fullName,
      `<p>Bayaran keahlian anda telah <strong>berjaya diterima</strong>.</p>
       ${box([{ label: "Nombor Keahlian", value: member.memberNo }])}
       <p>Pendaftaran anda kini dalam semakan admin sebelum status keahlian diaktifkan sepenuhnya. Kami akan maklumkan sebaik ia disahkan.</p>`
    ),
  });
}

// Dihantar bila admin sahkan keahlian (status MENUNGGU_SEMAKAN -> AKTIF).
export async function sendMemberActivatedEmail(member: { fullName: string; email: string; memberNo: string }) {
  await sendEmail({
    to: member.email,
    subject: "Keahlian Anda Sudah Aktif - Pertubuhan Literasi Tanah",
    html: wrap(
      member.fullName,
      `<p>Tahniah! Keahlian anda telah <strong>disahkan dan kini AKTIF</strong>.</p>
       ${box([{ label: "Nombor Keahlian", value: member.memberNo }])}
       <p>Anda kini rasmi menjadi ahli Pertubuhan Literasi Tanah. Boleh semak status keahlian anda pada bila-bila masa di <a href="https://tanahmalaya.org/semak" style="color:#C68A2E;">tanahmalaya.org/semak</a>.</p>`
    ),
  });
}

// Dihantar bila admin TOLAK pendaftaran keahlian (status -> TIDAK_AKTIF).
export async function sendMemberRejectedEmail(member: { fullName: string; email: string; memberNo: string }) {
  await sendEmail({
    to: member.email,
    subject: "Kemaskini Pendaftaran Keahlian - Pertubuhan Literasi Tanah",
    html: wrap(
      member.fullName,
      `<p>Setelah disemak, kami memohon maaf kerana pendaftaran keahlian anda (No. Keahlian: <strong>${member.memberNo}</strong>) <strong>tidak dapat diteruskan</strong> pada masa ini.</p>
       <p>Yuran keahlian yang telah anda bayar boleh dimohon semula (refund). Sila isi borang permohonan refund di <a href="https://tanahmalaya.org/keahlian/semak" style="color:#C68A2E;">tanahmalaya.org/keahlian/semak</a> (masukkan No. KP anda untuk semak status &amp; mohon refund).</p>
       <p>Kalau ada sebarang pertanyaan, sila hubungi kami di <a href="mailto:info@tanahmalaya.org" style="color:#C68A2E;">info@tanahmalaya.org</a>.</p>`
    ),
  });
}

// Dihantar bila Order (pembelian merchandise) berjaya dibayar.
export async function sendOrderReceiptEmail(order: {
  seq: number;
  emel: string;
  namaPembeli: string;
  jumlahSen: number;
  shippingSen: number;
  items: { kuantiti: number; hargaSen: number; saiz: string | null; product: { nama: string } }[];
}) {
  const itemRows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F5F1E9;font-size:14px;">
          ${it.product.nama}${it.saiz ? ` <span style="color:#8B5A2B;">(${it.saiz})</span>` : ""}<br/>
          <span style="color:#8B5A2B;font-size:13px;">x${it.kuantiti}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #F5F1E9;font-size:14px;text-align:right;white-space:nowrap;">
          ${formatRM(it.hargaSen * it.kuantiti)}
        </td>
      </tr>`
    )
    .join("");

  await sendEmail({
    to: order.emel,
    subject: `Resit Pembelian #${order.seq} - Pertubuhan Literasi Tanah`,
    html: wrap(
      order.namaPembeli,
      `<p>Bayaran anda untuk pembelian <strong>#${order.seq}</strong> telah <strong>berjaya diterima</strong>. Berikut resit pembelian anda:</p>
       <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
         ${itemRows}
       </table>
       ${box([
         { label: "Penghantaran", value: formatRM(order.shippingSen) },
         { label: "Jumlah", value: formatRM(order.jumlahSen) },
       ])}
       <p>Pesanan anda akan diproses dan dihantar tidak lama lagi.</p>`
    ),
  });
}

// Dihantar bila Order (pembelian merchandise) siap fulfill & tracking number diperoleh.
export async function sendOrderTrackingEmail(order: { seq: number; emel: string; namaPembeli: string; trackingNumber: string; courierName: string | null }) {
  await sendEmail({
    to: order.emel,
    subject: `Pesanan #${order.seq} Telah Dihantar - Pertubuhan Literasi Tanah`,
    html: wrap(
      order.namaPembeli,
      `<p>Berita baik! Pesanan anda <strong>#${order.seq}</strong> telah dihantar.</p>
       ${box([
         { label: "Kurier", value: order.courierName ?? "-" },
         { label: "No. Tracking", value: order.trackingNumber },
       ])}
       <p>Sila jejak status penghantaran melalui laman web rasmi kurier di atas menggunakan no. tracking tersebut.</p>`
    ),
  });
}

// Dihantar bila pendaftaran Program & Kelas berjaya dibayar.
export async function sendClassRegistrationEmail(registration: {
  namaPeserta: string;
  emel: string;
  class: { namaKelas: string; topik: string; tarikh: Date; lokasi: string; jadual: string | null };
}) {
  const { class: kelas } = registration;
  await sendEmail({
    to: registration.emel,
    subject: `Pendaftaran Kelas Berjaya - ${kelas.namaKelas}`,
    html: wrap(
      registration.namaPeserta,
      `<p>Pendaftaran anda untuk <strong>${kelas.namaKelas}</strong> (${kelas.topik}) telah <strong>berjaya</strong>.</p>
       ${box([
         { label: "Tarikh", value: kelas.tarikh.toLocaleDateString("ms-MY") },
         { label: "Lokasi", value: kelas.lokasi },
         ...(kelas.jadual ? [{ label: "Jadual", value: kelas.jadual }] : []),
       ])}
       <p>Kami tunggu kehadiran anda!</p>`
    ),
  });
}

// Dihantar bila admin LULUSKAN tuntutan petty cash (status -> DILULUSKAN).
export async function sendClaimApprovedEmail(claim: { seq: number; namaPemohon: string; email: string; jumlahSen: number }) {
  await sendEmail({
    to: claim.email,
    subject: `Claim #${claim.seq} Diluluskan - Pertubuhan Literasi Tanah`,
    html: wrap(
      claim.namaPemohon,
      `<p>Claim anda telah <strong>diluluskan</strong>.</p>
       ${box([
         { label: "No. Claim", value: `#${claim.seq}` },
         { label: "Jumlah", value: formatRM(claim.jumlahSen) },
       ])}
       <p>Bayaran akan diproses ke akaun bank yang didaftarkan. Kami akan maklumkan sebaik bayaran selesai.</p>`
    ),
  });
}

// Dihantar bila admin TOLAK tuntutan petty cash (status -> DITOLAK).
export async function sendClaimRejectedEmail(claim: { seq: number; namaPemohon: string; email: string; jumlahSen: number; catatanAdmin: string | null }) {
  await sendEmail({
    to: claim.email,
    subject: `Claim #${claim.seq} Ditolak - Pertubuhan Literasi Tanah`,
    html: wrap(
      claim.namaPemohon,
      `<p>Setelah disemak, claim anda (<strong>#${claim.seq}</strong>, ${formatRM(claim.jumlahSen)}) <strong>tidak dapat diluluskan</strong> pada masa ini.</p>
       ${claim.catatanAdmin ? `<p><strong>Sebab:</strong> ${claim.catatanAdmin}</p>` : ""}
       <p>Kalau ada sebarang pertanyaan, sila hubungi kami di <a href="mailto:info@tanahmalaya.org" style="color:#C68A2E;">info@tanahmalaya.org</a>.</p>`
    ),
  });
}

// Dihantar bila admin tandakan tuntutan petty cash sudah dibayar (status -> DIBAYAR).
export async function sendClaimPaidEmail(claim: { seq: number; namaPemohon: string; email: string; jumlahSen: number }) {
  await sendEmail({
    to: claim.email,
    subject: `Claim #${claim.seq} Telah Dibayar - Pertubuhan Literasi Tanah`,
    html: wrap(
      claim.namaPemohon,
      `<p>Bayaran balik untuk claim anda telah <strong>dihantar</strong>.</p>
       ${box([
         { label: "No. Claim", value: `#${claim.seq}` },
         { label: "Jumlah", value: formatRM(claim.jumlahSen) },
       ])}
       <p>Sila semak akaun bank anda. Terima kasih atas kesabaran anda.</p>`
    ),
  });
}

// Dihantar bila Sumbangan Ikhlas berjaya dibayar.
export async function sendDonationReceiptEmail(donation: { seq: number; namaPenderma: string; emel: string; amountSen: number }) {
  await sendEmail({
    to: donation.emel,
    subject: `Terima Kasih atas Sumbangan Anda - Pertubuhan Literasi Tanah`,
    html: wrap(
      donation.namaPenderma,
      `<p>Sumbangan ikhlas anda telah <strong>berjaya diterima</strong>.</p>
       ${box([
         { label: "Jumlah Sumbangan", value: formatRM(donation.amountSen) },
         { label: "Rujukan", value: `#${donation.seq}` },
       ])}
       <p>Semoga Allah membalas kebaikan dan keikhlasan anda. Sumbangan ini amat bermakna untuk usaha kami memperkasa literasi tanah masyarakat.</p>`
    ),
  });
}
