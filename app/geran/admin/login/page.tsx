import PasswordInput from "@/components/PasswordInput";

export const metadata = {
  title: "Admin Log Masuk",
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "GERAN",
    title: "GERAN Admin",
    description: "Dashboard admin gerantanah.com.",
    images: [{ url: "https://gerantanah.com/geran-logo-g.jpeg", alt: "GERAN" }],
  },
};

export default function GeranAdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3EE]">
      <form action="/api/geran-admin/login" method="POST" className="bg-white p-8 rounded-md shadow-sm w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl font-extrabold text-center mb-2 text-[#0E3B2E]">GERAN Admin</h1>
        <p className="text-sm text-black/60 text-center mb-4">gerantanah.com</p>
        <div>
          <label className="block text-sm font-semibold mb-1">E-mel</label>
          <input type="email" name="email" required className="w-full border border-black/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Kata Laluan</label>
          <PasswordInput name="password" required className="w-full border border-black/20 rounded-sm p-3" />
        </div>
        <button type="submit" className="bg-[#0E3B2E] text-white font-semibold px-6 py-3 rounded-sm w-full">
          LOG MASUK
        </button>
      </form>
    </div>
  );
}
