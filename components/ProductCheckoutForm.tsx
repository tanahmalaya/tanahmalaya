"use client";

import { useState, FormEvent } from "react";
import { useCart } from "@/app/context/CartContext";

const NEGERI_LIST = [
  "Johor", "Kedah", "Kelantan", "Melaka", "Negeri Sembilan", "Pahang",
  "Perak", "Perlis", "Pulau Pinang", "Sabah", "Sarawak", "Selangor",
  "Terengganu", "Kuala Lumpur", "Labuan", "Putrajaya",
];

function formatRM(sen: number) {
  return `RM${(sen / 100).toFixed(2)}`;
}

type QuoteItem = {
  id: string;
  namaProduk: string;
  kuantiti: number;
  hargaBarangSen: number;
};

type Quote = {
  items: QuoteItem[];
  subtotalSen: number;
  shippingSen: number;
  jumlahSen: number;
  courierName: string | null;
};

type SizeInfo = { saiz: string; label: string; stok: number };

export default function ProductCheckoutForm({
  productId,
  nama,
  price,
  stok,
  sizes = [],
}: {
  productId?: string;
  nama?: string;
  price?: number;
  stok?: number;
  sizes?: SizeInfo[];
}) {
  const { cart, addToCart, clearCart, updateQty, removeFromCart } = useCart();
  const [step, setStep] = useState<"form" | "confirm">("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState("");
  const [selectedSize, setSelectedSize] = useState<string | null>(
    sizes.find((s) => s.stok > 0)?.saiz ?? null
  );
  const [qty, setQty] = useState(1);

  const selectedSizeInfo = sizes.find((s) => s.saiz === selectedSize) || null;
  const maxQty = sizes.length > 0 ? selectedSizeInfo?.stok ?? 0 : stok || 99;

  function handleAddToCart() {
    if (!productId || !nama || price == null) return;
    if (sizes.length > 0 && !selectedSize) {
      setError("Sila pilih saiz dahulu.");
      return;
    }
    setError("");
    const cartId = selectedSize ? `${productId}:${selectedSize}` : productId;
    const label = selectedSizeInfo ? `${nama} (${selectedSizeInfo.label})` : nama;
    addToCart({ id: cartId, productId, saiz: selectedSize, name: label, price, quantity: qty });
  }

  async function handleReview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (cart.length === 0 && sizes.length > 0 && !selectedSize) {
      setError("Sila pilih saiz dahulu.");
      return;
    }

    setLoading(true);

    const fd = new FormData(e.currentTarget);

    const orderItems = cart.length > 0
      ? cart.map((item) => ({ productId: item.productId, kuantiti: item.quantity, saiz: item.saiz }))
      : [{ productId: fd.get("productId") || productId, kuantiti: Number(fd.get("kuantiti") || 1), saiz: selectedSize }];

    try {
      const res = await fetch("/api/orders/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: orderItems,
          poskod: fd.get("poskod"),
          negeri: fd.get("negeri"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal kira harga");

      setFormData(fd);
      setQuote(data);
      setStep("confirm");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!formData) return;
    setLoading(true);
    setError("");

    const payload = new FormData();
    formData.forEach((value, key) => payload.append(key, value));
    payload.append("cart", JSON.stringify(cart));

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        body: payload,
      });
      const result = await res.json();
      if (result.url) {
        clearCart();
        window.location.href = result.url;
      } else {
        setError(result.error || "Gagal mendapatkan pautan pembayaran.");
        setLoading(false);
      }
    } catch (err) {
      setError("Ralat berlaku semasa pemprosesan. Sila cuba lagi.");
      setLoading(false);
    }
  }

  if (step === "confirm" && quote && formData) {
    return (
      <div className="bg-white p-5 rounded-md shadow-sm space-y-4">
        <h3 className="font-semibold text-lg border-b pb-2">Sahkan Pesanan</h3>

        <div className="text-sm space-y-1 border-b border-brand-cream pb-4">
          <p><strong>Nama:</strong> {String(formData.get("namaPembeli"))}</p>
          <p><strong>Telefon:</strong> {String(formData.get("telefon"))}</p>
          <p><strong>E-mel:</strong> {String(formData.get("emel"))}</p>
          <p className="pt-2">
            <strong>Alamat:</strong> {String(formData.get("alamat"))}, {String(formData.get("poskod"))}{" "}
            {String(formData.get("bandar"))}, {String(formData.get("negeri"))}
          </p>
        </div>

        <div className="text-sm space-y-2 border-b border-brand-cream pb-4">
          <p className="font-semibold">Barangan Pesanan:</p>
          {quote.items ? (
            quote.items.map((item, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{item.namaProduk} x{item.kuantiti}</span>
                <span>{formatRM(item.hargaBarangSen)}</span>
              </div>
            ))
          ) : (
            <div className="flex justify-between">
              <span>x{String(formData.get("kuantiti") || 1)}</span>
            </div>
          )}
          <div className="flex justify-between text-brand-dark/70 pt-2 border-t">
            <span>Penghantaran{quote.courierName ? ` (${quote.courierName})` : ""}</span>
            <span>{formatRM(quote.shippingSen)}</span>
          </div>
        </div>

        <div className="flex justify-between font-bold text-lg">
          <span>Jumlah Keseluruhan</span>
          <span className="text-brand-gold">{formatRM(quote.jumlahSen)}</span>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={loading}
            className="flex-1 border border-brand-dark/20 text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
          >
            KEMBALI
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 bg-brand-gold text-brand-dark font-semibold py-3 rounded-sm disabled:opacity-50"
          >
            {loading ? "Memproses..." : "SAHKAN & BAYAR"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleReview} className="space-y-3 bg-white p-5 rounded-md shadow-sm">
      <input type="hidden" name="productId" value={productId || ""} />
      <input type="hidden" name="saiz" value={selectedSize || ""} />

      {sizes.length > 0 && (
        <div>
          <label className="block text-xs font-semibold mb-2">Saiz</label>
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s.saiz}
                type="button"
                disabled={s.stok <= 0}
                onClick={() => {
                  setSelectedSize(s.saiz);
                  setQty(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-sm border disabled:opacity-30 disabled:line-through ${
                  selectedSize === s.saiz
                    ? "bg-brand-gold border-brand-gold text-brand-dark"
                    : "border-brand-dark/20 text-brand-dark"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {productId && nama && price != null && (
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Kuantiti</label>
            <input
              type="number"
              min={1}
              max={maxQty || 1}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(maxQty || 1, Number(e.target.value) || 1)))}
              className="w-20 border border-brand-dark/20 rounded-sm p-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={maxQty <= 0 || (sizes.length > 0 && !selectedSize)}
            className="flex-1 border border-brand-dark/30 text-brand-dark font-semibold text-sm py-2 rounded-sm disabled:opacity-40"
          >
            TAMBAH KE TROLI
          </button>
        </div>
      )}

      <div className="border-b pb-3 mb-3">
        <h4 className="font-semibold text-sm mb-2">Ringkasan Trolley ({cart.length} Barangan)</h4>
        {cart.length === 0 ? (
          <p className="text-xs text-gray-500">Tiada barangan tambahan dalam trolley.</p>
        ) : (
          <div className="space-y-2">
            {cart.map((item) => (
              <div
                key={item.id}
                className="text-xs text-gray-700 border-b border-brand-cream/60 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="flex-1">{item.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-red-500 text-sm leading-none px-1"
                    aria-label={`Buang ${item.name} daripada trolley`}
                  >
                    ×
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.max(1, item.quantity - 1))}
                      disabled={item.quantity <= 1}
                      className="w-6 h-6 flex items-center justify-center border border-brand-dark/20 rounded-sm font-semibold leading-none disabled:opacity-30"
                      aria-label={`Kurangkan kuantiti ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-5 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQty(item.id, Math.min(99, item.quantity + 1))}
                      className="w-6 h-6 flex items-center justify-center border border-brand-dark/20 rounded-sm font-semibold leading-none"
                      aria-label={`Tambahkan kuantiti ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <span>RM {(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {cart.length === 0 && <input type="hidden" name="kuantiti" value={qty} />}

      <div>
        <label className="block text-xs font-semibold mb-1">Nama Penuh</label>
        <input name="namaPembeli" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">No Telefon</label>
        <input name="telefon" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">E-mel</label>
        <input type="email" name="emel" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div className="border-t border-brand-cream pt-3 mt-3">
        <p className="text-xs font-semibold mb-2">Alamat Penghantaran</p>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Alamat</label>
        <textarea name="alamat" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Poskod</label>
          <input name="poskod" required pattern="[0-9]{5}" className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Bandar</label>
          <input name="bandar" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold mb-1">Negeri</label>
        <select name="negeri" required className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm">
          <option value="">Pilih negeri</option>
          {NEGERI_LIST.map((n) => (
            <option key={n}>{n}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-gold text-brand-dark font-semibold px-6 py-3 rounded-sm w-full disabled:opacity-50"
      >
        {loading ? "MENGIRA..." : "SEMAK PESANAN"}
      </button>
    </form>
  );
}
