export default function AdminLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream">
      <form action="/api/admin/login" method="POST" className="bg-white p-8 rounded-md shadow-sm w-full max-w-sm space-y-4">
        <h1 className="font-display text-2xl font-bold text-center mb-2">Dashboard Admin</h1>
        <p className="text-sm text-brand-dark/60 text-center mb-4">Pertubuhan Literasi Tanah</p>
        <div>
          <label className="block text-sm font-semibold mb-1">E-mel</label>
          <input type="email" name="email" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">Kata Laluan</label>
          <input type="password" name="password" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <button type="submit" className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full">
          LOG MASUK
        </button>
      </form>
    </div>
  );
}
