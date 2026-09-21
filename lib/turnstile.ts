// Human verification untuk borang akaun GERAN (daftar, log masuk, lupa kata
// laluan) guna Cloudflare Turnstile.
//
// Env yang diperlukan:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY - kunci awam, dibaca oleh widget pelayar
//   TURNSTILE_SECRET_KEY           - kunci rahsia, hanya di pelayan
//
// Kalau TURNSTILE_SECRET_KEY tiada: dalam pembangunan semakan dilangkau
// supaya borang boleh diuji tanpa kunci, tetapi dalam produksi ia GAGAL -
// lebih baik borang tak jalan daripada berjalan tanpa perlindungan.

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export type HasilTurnstile = { ok: true } | { ok: false; sebab: string };

export async function sahkanTurnstile(token: string | null | undefined, ip?: string | null): Promise<HasilTurnstile> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("TURNSTILE_SECRET_KEY tak ditetapkan - borang akaun ditolak.");
      return { ok: false, sebab: "Human verification is not configured. Please contact PLT." };
    }
    console.warn("TURNSTILE_SECRET_KEY tak ditetapkan - semakan dilangkau (pembangunan sahaja).");
    return { ok: true };
  }

  if (!token) {
    return { ok: false, sebab: "Please complete the human verification." };
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) {
      console.warn("Turnstile gagal:", data["error-codes"]);
      return { ok: false, sebab: "Human verification failed. Please try again." };
    }
    return { ok: true };
  } catch (e) {
    console.error("Turnstile tak dapat dihubungi:", e);
    return { ok: false, sebab: "Could not reach the verification service. Please try again." };
  }
}

// Turnstile hantar IP sebenar melalui header proksi Vercel.
export function ipDariRequest(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0].trim() : null;
}
