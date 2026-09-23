import PasswordInput from "@/components/PasswordInput";
import GeranLogo from "@/components/geran/GeranLogo";

export const metadata = {
  title: "Admin Log In",
  robots: { index: false, follow: false },
  openGraph: {
    siteName: "GERAN",
    title: "LANDHUB — GERAN Admin",
    description: "Land management dashboard for gerantanah.com.",
    images: [{ url: "https://gerantanah.com/geran-logo-g.jpeg", alt: "GERAN" }],
  },
};

const INPUT =
  "w-full h-11 rounded-lg border border-black/[0.12] bg-white px-3 text-sm outline-none transition focus:border-emerald-600/60 focus:ring-2 focus:ring-emerald-600/15";

export default function GeranAdminLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4F6F5] px-4">
      <form
        action="/api/geran-admin/login"
        method="POST"
        className="bg-white p-8 rounded-2xl border border-black/[0.06] shadow-sm w-full max-w-sm space-y-4"
      >
        <div className="flex flex-col items-center text-center mb-2">
          <GeranLogo size={44} />
          <h1 className="font-display text-xl font-extrabold tracking-wide mt-3 text-[#0B2A1F]">LANDHUB</h1>
          <p className="text-xs uppercase tracking-[0.14em] text-black/40">Land Management System</p>
        </div>
        {/* app/api/geran-admin/login redirect balik dengan ?error=1 bila
            emel/kata laluan salah. */}
        {searchParams.error && (
          <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700" role="alert">
            Incorrect email or password.
          </p>
        )}
        <label className="block">
          <span className="block text-[12.5px] font-semibold text-black/60 mb-1.5">Email</span>
          <input type="email" name="email" required autoComplete="username" className={INPUT} />
        </label>
        <label className="block">
          <span className="block text-[12.5px] font-semibold text-black/60 mb-1.5">Password</span>
          <PasswordInput name="password" required autoComplete="current-password" className={INPUT} />
        </label>
        <button type="submit" className="h-11 w-full rounded-lg bg-emerald-700 text-sm font-bold text-white hover:bg-emerald-800">
          Log In
        </button>
      </form>
    </div>
  );
}
