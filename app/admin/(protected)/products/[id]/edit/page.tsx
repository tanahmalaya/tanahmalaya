export const dynamic = "force-dynamic";

import { requireAdminOnly } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SIZE_OPTIONS } from "@/lib/productSize";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  requireAdminOnly();

  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { sizes: true },
  });
  if (!product) return notFound();

  const hargaRM = (product.hargaSen / 100).toFixed(2);
  const shippingFlatRM = product.shippingFlatSen != null ? (product.shippingFlatSen / 100).toFixed(2) : "";
  const sizeStok = Object.fromEntries(product.sizes.map((s) => [s.saiz, s.stok]));

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-brand-gold mb-4 inline-block">
        &larr; Kembali ke Senarai Merchandise
      </Link>
      <h1 className="font-display text-2xl font-bold mb-6">Edit Produk</h1>

      <div className="bg-white rounded-md shadow-sm p-6">
        <form action={`/api/products/${product.id}/update`} method="POST" className="grid sm:grid-cols-2 gap-4">
          <input
            name="nama"
            defaultValue={product.nama}
            placeholder="Nama Produk"
            required
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />
          <textarea
            name="penerangan"
            defaultValue={product.penerangan ?? ""}
            placeholder="Penerangan produk (pilihan) - bahan, dll"
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />
          <input
            name="harga"
            type="number"
            step="0.01"
            defaultValue={hargaRM}
            placeholder="Harga (RM)"
            required
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <div>
            <label className="block text-xs font-semibold mb-1">Status</label>
            <select name="status" defaultValue={product.status} className="w-full border border-brand-dark/20 rounded-sm p-3">
              <option value="READY_STOCK">Ready Stock</option>
              <option value="PREORDER">Pre-order</option>
            </select>
          </div>

          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-1">Saiz Baju (pilihan)</p>
            <p className="text-xs text-brand-dark/50 mb-3">
              Isi stok untuk saiz yang berkenaan sahaja (kosongkan saiz yang tiada). Kalau produk ni bukan
              pakaian, biarkan semua kosong dan isi "Stok" di bawah sebagai ganti.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {SIZE_OPTIONS.map((s) => (
                <div key={s.value}>
                  <label className="block text-xs font-semibold mb-1">{s.label}</label>
                  <input
                    name={`saiz_${s.value}`}
                    type="number"
                    min={0}
                    defaultValue={sizeStok[s.value] ?? ""}
                    placeholder="Stok"
                    className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                  />
                </div>
              ))}
            </div>
          </div>
          <input
            name="stok"
            type="number"
            defaultValue={product.sizes.length === 0 ? product.stok : ""}
            placeholder="Stok (jika produk TIADA saiz)"
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />

          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Gambar Produk</p>
          </div>
          <input
            name="gambarDepan"
            defaultValue={product.gambarDepan ?? ""}
            placeholder="URL Gambar DEPAN (utama)"
            required
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />
          <input
            name="gambarBelakang"
            defaultValue={product.gambarBelakang ?? ""}
            placeholder="URL Gambar BELAKANG (pilihan)"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="gambarSisi"
            defaultValue={product.gambarSisi ?? ""}
            placeholder="URL Gambar SISI (pilihan)"
            className="border border-brand-dark/20 rounded-sm p-3"
          />
          <input
            name="sizingChartUrl"
            defaultValue={product.sizingChartUrl ?? ""}
            placeholder="URL Carta Saiz (pilihan)"
            className="border border-brand-dark/20 rounded-sm p-3 sm:col-span-2"
          />

          <div className="sm:col-span-2 border-t border-brand-cream pt-4 mt-2">
            <p className="text-sm font-semibold mb-3">Penghantaran</p>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kaedah Kadar Penghantaran</label>
            <select name="shippingMode" defaultValue={product.shippingMode} className="w-full border border-brand-dark/20 rounded-sm p-3">
              <option value="FLAT">Kadar Tetap (contoh: baju, minyak wangi)</option>
              <option value="BERAT">Ikut Berat (kira automatik EasyParcel)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kadar Tetap (RM) - isi jika pilih 'Kadar Tetap'</label>
            <input
              name="shippingFlatRM"
              type="number"
              step="0.01"
              defaultValue={shippingFlatRM}
              placeholder="cth: 8.00"
              className="w-full border border-brand-dark/20 rounded-sm p-3"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold mb-1">Berat Produk (gram) - isi jika pilih 'Ikut Berat'</label>
            <input
              name="beratGram"
              type="number"
              defaultValue={product.beratGram ?? ""}
              placeholder="cth: 500"
              className="w-full border border-brand-dark/20 rounded-sm p-3"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Aktif (dipaparkan di laman merchandise)</label>
            <select name="aktif" defaultValue={product.aktif ? "true" : "false"} className="w-full border border-brand-dark/20 rounded-sm p-3">
              <option value="true">Ya</option>
              <option value="false">Tidak</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex gap-3 mt-2">
            <button type="submit" className="flex-1 bg-brand-gold text-brand-dark font-semibold rounded-sm px-4 py-3">
              SIMPAN PERUBAHAN
            </button>
            <Link
              href="/admin/products"
              className="flex-1 text-center border border-brand-dark/20 text-brand-dark font-semibold rounded-sm px-4 py-3"
            >
              BATAL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
