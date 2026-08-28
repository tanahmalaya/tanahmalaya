export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage() {
  requireAdminOnly();
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold mb-6">Urus Merchandise</h1>

      <div className="bg-white rounded-md shadow-sm p-6 mb-8">
        <h2 className="font-semibold mb-4">Tambah Produk</h2>
        <form action="/api/products" method="POST" className="grid sm:grid-cols-2 gap-4">
          <input name="nama" placeholder="Nama Produk" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <textarea name="penerangan" placeholder="Penerangan produk (pilihan) - bahan, saiz tersedia, dll" className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <input name="harga" type="number" step="0.01" placeholder="Harga (RM)" required className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="stok" type="number" placeholder="Stok" required className="border border-brand-dark/20 rounded-sm p-3" />

          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Gambar Produk</p>
          </div>
          <input name="gambarDepan" placeholder="URL Gambar DEPAN (utama)" required className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />
          <input name="gambarBelakang" placeholder="URL Gambar BELAKANG (pilihan)" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="gambarSisi" placeholder="URL Gambar SISI (pilihan)" className="border border-brand-dark/20 rounded-sm p-3" />
          <input name="sizingChartUrl" placeholder="URL Carta Saiz (pilihan)" className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2" />

          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Penghantaran</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kaedah Kadar Penghantaran</label>
            <select name="shippingMode" className="w-full border border-brand-dark/20 rounded-sm p-3">
              <option value="FLAT">Kadar Tetap (contoh: baju, minyak wangi)</option>
              <option value="BERAT">Ikut Berat (kira automatik EasyParcel)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kadar Tetap (RM) - isi jika pilih 'Kadar Tetap'</label>
            <input name="shippingFlatRM" type="number" step="0.01" placeholder="cth: 8.00" className="w-full border border-brand-dark/20 rounded-sm p-3" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Berat Produk (gram) - isi jika pilih 'Ikut Berat'</label>
            <input name="beratGram" type="number" placeholder="cth: 500" className="w-full border border-brand-dark/20 rounded-sm p-3" />
          </div>

          <button type="submit" className="bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3 sm:col-span-2">
            TAMBAH PRODUK
          </button>
        </form>
      </div>

      <div className="bg-white rounded-md shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-brand-cream text-left">
            <tr><th className="p-4">Gambar</th><th className="p-4">Nama</th><th className="p-4">Harga</th><th className="p-4">Stok</th><th className="p-4">Aktif</th><th className="p-4"></th></tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-brand-cream">
                <td className="p-4">
                  {p.gambarDepan && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.gambarDepan} alt={p.nama} className="w-12 h-12 object-cover rounded-sm" />
                  )}
                </td>
                <td className="p-4">{p.nama}</td>
                <td className="p-4">RM{(p.hargaSen / 100).toFixed(2)}</td>
                <td className="p-4">{p.stok}</td>
                <td className="p-4">{p.aktif ? "Ya" : "Tidak"}</td>
                <td className="p-4">
                  <form action={`/api/products/${p.id}/delete`} method="POST">
                    <button type="submit" className="text-red-600 text-xs font-semibold hover:underline">
                      PADAM
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
