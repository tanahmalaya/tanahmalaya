const RESEND_API_KEY = process.env.RESEND_API_KEY!;
// Alamat "from" mesti dari domain yang dah disahkan (verified) dalam akaun Resend.
const EMAIL_FROM = process.env.EMAIL_FROM || "Pertubuhan Literasi Tanah <no-reply@tanahmalaya.org>";

/**
 * Hantar satu email melalui Resend (guna fetch terus ke API mereka, bukan SDK,
 * konsisten dengan cara lib/bayarcash.ts panggil API luar).
 */
export async function sendEmail(params: { to: string; subject: string; html: string }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resend error: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<{ id: string }>;
}
