export default function KeahlianPage() {
  return (
    <section className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Borang Keahlian</h1>
      <p className="text-brand-dark/70 mb-8">
        Sertai Pertubuhan Literasi Tanah dan nikmati akses kepada kelas eksklusif,
        bahan pembelajaran, dan aktiviti komuniti. Yuran keahlian akan diproses
        melalui BayarCash.
      </p>

      <form action="/api/members" method="POST" className="space-y-5 bg-white p-8 rounded-md shadow-sm">
        <div>
          <label className="block text-sm font-semibold mb-1">Nama Penuh</label>
          <input name="fullName" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">No Kad Pengenalan (tanpa tanda -)</label>
          <input name="icNumber" required pattern="[0-9]{12}" className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">No Telefon</label>
          <input name="phone" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">E-mel</label>
          <input type="email" name="email" required className="w-full border border-brand-dark/20 rounded-sm p-3" />
        </div>
        <button type="submit" className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full">
          DAFTAR & TERUSKAN KE BAYARAN
        </button>
      </form>
    </section>
  );
}
