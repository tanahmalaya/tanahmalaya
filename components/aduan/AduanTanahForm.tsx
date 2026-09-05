"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import LampiranUpload from "./LampiranUpload";
import SumbanganCard from "@/components/SumbanganCard";
import { NEGERI_LIST, HUBUNGAN_OPTIONS, KATEGORI_TANAH_OPTIONS, JENIS_PENCEROBOHAN_OPTIONS } from "@/lib/aduanTanah";

const PetaPinLokasi = dynamic(() => import("./PetaPinLokasi"), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] rounded-md bg-brand-cream animate-pulse flex items-center justify-center text-brand-dark/50 text-sm">
      Memuatkan peta...
    </div>
  ),
});

type Pin = { lat: number; lng: number };

const TABS = [
  { id: 1, label: "1. Pengadu" },
  { id: 2, label: "2. Lokasi Tanah" },
  { id: 3, label: "3. Butiran Isu" },
  { id: 4, label: "4. Lampiran" },
  { id: 5, label: "5. Pengesahan" },
] as const;

export default function AduanTanahForm() {
  const [status, setStatus] = useState<"form" | "menghantar" | "berjaya" | "ralat">("form");
  const [activeTab, setActiveTab] = useState(1);
  const [ralat, setRalat] = useState("");
  const [seqBerjaya, setSeqBerjaya] = useState<number | null>(null);

  const [anonim, setAnonim] = useState(true);
  const [benarkanDihubungi, setBenarkanDihubungi] = useState(false);
  const [namaPenuh, setNamaPenuh] = useState("");
  const [telefon, setTelefon] = useState("");
  const [emel, setEmel] = useState("");
  const [hubungan, setHubungan] = useState("");

  const [negeri, setNegeri] = useState("");
  const [daerahMukim, setDaerahMukim] = useState("");
  const [nomborLot, setNomborLot] = useState("");
  const [pin, setPin] = useState<Pin | null>(null);
  const [statusKategoriTanah, setStatusKategoriTanah] = useState("");

  const [jenisPencerobohan, setJenisPencerobohan] = useState<string[]>([]);
  const [jenisLain, setJenisLain] = useState("");
  const [anggaranTarikhMula, setAnggaranTarikhMula] = useState("");
  const [keteranganTerperinci, setKeteranganTerperinci] = useState("");

  const [fotoUrls, setFotoUrls] = useState<string[]>([]);
  const [dokumenUrls, setDokumenUrls] = useState<string[]>([]);

  const [pengesahanMaklumat, setPengesahanMaklumat] = useState(false);
  const [persetujuanPdpa, setPersetujuanPdpa] = useState(false);

  function toggleJenis(value: string) {
    setJenisPencerobohan((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function validateTab(tab: number): string | null {
    if (tab === 1) {
      if (!anonim && benarkanDihubungi && (!namaPenuh.trim() || !telefon.trim())) {
        return "Sila lengkapkan nama & no. telefon untuk dihubungi, atau pilih kekal anonim.";
      }
      if (!hubungan) return "Sila pilih hubungan pengadu dengan tanah.";
    }
    if (tab === 2) {
      if (!negeri) return "Sila pilih negeri.";
      if (!daerahMukim.trim()) return "Sila isi daerah / mukim.";
      if (!statusKategoriTanah) return "Sila pilih status kategori tanah.";
    }
    if (tab === 3) {
      if (jenisPencerobohan.length === 0) return "Sila pilih sekurang-kurangnya satu jenis pencerobohan/isu.";
      if (keteranganTerperinci.trim().length < 10) return "Sila lengkapkan keterangan terperinci aduan (sekurang-kurangnya 10 aksara).";
    }
    if (tab === 5) {
      if (!pengesahanMaklumat || !persetujuanPdpa) {
        return "Sila tandakan kedua-dua kotak pengesahan & persetujuan PDPA.";
      }
    }
    return null;
  }

  function goTab(tab: number) {
    setRalat("");
    setActiveTab(tab);
  }

  function handleNext() {
    const err = validateTab(activeTab);
    if (err) {
      setRalat(err);
      return;
    }
    goTab(Math.min(activeTab + 1, TABS.length));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    for (const t of TABS) {
      const err = validateTab(t.id);
      if (err) {
        setRalat(err);
        setActiveTab(t.id);
        return;
      }
    }
    setRalat("");

    setStatus("menghantar");
    try {
      const res = await fetch("/api/aduan-tanah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          anonim,
          benarkanDihubungi,
          namaPenuh: namaPenuh || null,
          telefon: telefon || null,
          emel: emel || null,
          hubungan,

          negeri,
          daerahMukim,
          nomborLot: nomborLot || null,
          gpsLat: pin?.lat ?? null,
          gpsLng: pin?.lng ?? null,
          statusKategoriTanah,

          jenisPencerobohan,
          jenisLain: jenisLain || null,
          anggaranTarikhMula: anggaranTarikhMula || null,
          keteranganTerperinci,

          fotoUrls,
          dokumenUrls,

          pengesahanMaklumat,
          persetujuanPdpa,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRalat(json.error || "Gagal menghantar aduan. Sila cuba lagi.");
        setStatus("form");
        return;
      }
      setSeqBerjaya(json.seq);
      setStatus("berjaya");
    } catch {
      setRalat("Ralat rangkaian. Sila cuba lagi.");
      setStatus("form");
    }
  }

  if (status === "berjaya") {
    return (
      <div className="space-y-6">
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-6 text-center">
          <p className="font-display font-bold text-lg mb-1">Aduan Berjaya Dihantar</p>
          <p className="text-sm">
            Rujukan aduan anda: <strong>#{seqBerjaya}</strong>
          </p>
          <p className="text-sm mt-2">
            Terima kasih atas maklumat yang diberikan. Ini <strong>bukan</strong> pengganti laporan rasmi -
            sila juga hubungi Pejabat Tanah dan Galian (PTG), Pihak Berkuasa Tempatan (PBT) atau PDRM
            untuk tindakan segera.
          </p>
        </div>

        <div>
          <p className="text-center text-sm text-brand-dark/70 mb-3">
            Kerja advokasi &amp; pemantauan tanah PLT bergantung kepada sumbangan orang awam macam anda.
          </p>
          <SumbanganCard />
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-md shadow-sm overflow-hidden">
      <div className="flex overflow-x-auto border-b border-brand-cream">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => goTab(t.id)}
            className={`shrink-0 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === t.id
                ? "border-brand-gold text-brand-dark"
                : "border-transparent text-brand-dark/40 hover:text-brand-dark/70"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 sm:p-6 space-y-4">
        {activeTab === 1 && (
          <div className="space-y-4">
            <p className="text-xs text-brand-dark/60">
              Kerahsiaan anda keutamaan kami. Pengadu boleh memilih untuk membuat aduan secara anonim.
            </p>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="anonim"
                  checked={anonim}
                  onChange={() => {
                    setAnonim(true);
                    setBenarkanDihubungi(false);
                  }}
                />
                Kekalkan Kerahsiaan (Anonim)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="anonim" checked={!anonim} onChange={() => setAnonim(false)} />
                Benarkan Dihubungi Untuk Tindakan Susulan
              </label>
            </div>

            {!anonim && (
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-brand-cream">
                <div>
                  <label className="block text-xs font-semibold mb-1">Nama Penuh</label>
                  <input
                    value={namaPenuh}
                    onChange={(e) => setNamaPenuh(e.target.value)}
                    placeholder="Mengikut Kad Pengenalan"
                    className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Nombor Telefon / WhatsApp</label>
                  <input
                    value={telefon}
                    onChange={(e) => setTelefon(e.target.value)}
                    placeholder="012-3456789"
                    className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold mb-1">E-mel (pilihan)</label>
                  <input
                    type="email"
                    value={emel}
                    onChange={(e) => setEmel(e.target.value)}
                    placeholder="Untuk pengesahan penerimaan aduan & kemas kini status"
                    className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={benarkanDihubungi}
                    onChange={(e) => setBenarkanDihubungi(e.target.checked)}
                  />
                  Ya, boleh hubungi saya untuk tindakan susulan.
                </label>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1">Hubungan Pengadu Dengan Tanah</label>
              <select
                value={hubungan}
                onChange={(e) => setHubungan(e.target.value)}
                className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm bg-white"
              >
                <option value="">-- Sila Pilih --</option>
                {HUBUNGAN_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-brand-dark/60">
              Sila berikan maklumat lokasi secara tepat bagi memudahkan proses pengesahan tapak.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Negeri</label>
                <select
                  value={negeri}
                  onChange={(e) => setNegeri(e.target.value)}
                  className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm bg-white"
                >
                  <option value="">-- Sila Pilih --</option>
                  {NEGERI_LIST.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Daerah / Mukim</label>
                <input
                  value={daerahMukim}
                  onChange={(e) => setDaerahMukim(e.target.value)}
                  placeholder="Cth: Daerah Hulu Langat / Mukim Ampang"
                  className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold mb-1">Nombor Lot / Hakmilik (jika diketahui)</label>
                <input
                  value={nomborLot}
                  onChange={(e) => setNomborLot(e.target.value)}
                  placeholder="Cth: Lot 1234 / PT 5678"
                  className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Koordinat GPS / Pin Lokasi</label>
              <PetaPinLokasi value={pin} onChange={setPin} />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Status Kategori Tanah</label>
              <select
                value={statusKategoriTanah}
                onChange={(e) => setStatusKategoriTanah(e.target.value)}
                className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm bg-white"
              >
                <option value="">-- Sila Pilih --</option>
                {KATEGORI_TANAH_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {activeTab === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-brand-dark/60">Jelaskan jenis aktiviti dan perincian kejadian pencerobohan.</p>

            <div>
              <label className="block text-xs font-semibold mb-2">Jenis Pencerobohan / Isu (boleh pilih lebih dari satu)</label>
              <div className="grid sm:grid-cols-2 gap-2">
                {JENIS_PENCEROBOHAN_OPTIONS.map((o) => (
                  <label key={o.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={jenisPencerobohan.includes(o.value)}
                      onChange={() => toggleJenis(o.value)}
                    />
                    {o.label}
                  </label>
                ))}
              </div>
              {jenisPencerobohan.includes("LAIN_LAIN") && (
                <input
                  value={jenisLain}
                  onChange={(e) => setJenisLain(e.target.value)}
                  placeholder="Nyatakan jenis pencerobohan/isu lain"
                  className="mt-2 w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Anggaran Tarikh Mula Disedari</label>
              <input
                type="date"
                value={anggaranTarikhMula}
                onChange={(e) => setAnggaranTarikhMula(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full sm:w-60 border border-brand-dark/20 rounded-sm p-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">Keterangan Terperinci Aduan</label>
              <textarea
                rows={5}
                value={keteranganTerperinci}
                onChange={(e) => setKeteranganTerperinci(e.target.value)}
                placeholder="Nyatakan perincian aktiviti (cth: jenis jentera diguna, anggaran saiz kawasan terjejas, waktu aktiviti dijalankan, dsb.)"
                className="w-full border border-brand-dark/20 rounded-sm p-2 text-sm"
              />
            </div>
          </div>
        )}

        {activeTab === 4 && (
          <div className="space-y-5">
            <p className="text-xs text-brand-dark/60">Muat naik dokumen atau foto bagi mengukuhkan aduan anda (pilihan).</p>

            <LampiranUpload
              jenis="foto"
              label="Foto Kawasan Terjejas"
              hint="Format JPG, PNG, WEBP. Maksimum 5 fail, sehingga 10MB setiap fail. Sediakan pandangan jarak dekat & jauh."
              accept="image/jpeg,image/png,image/webp"
              maxFail={5}
              urls={fotoUrls}
              onChange={setFotoUrls}
            />

            <LampiranUpload
              jenis="dokumen"
              label="Dokumen Sokongan / Laporan"
              hint="Format PDF, DOCX. Salinan carian hakmilik, laporan polis, atau surat aduan PBT sebelum ini (jika ada)."
              accept="application/pdf,.doc,.docx"
              maxFail={5}
              urls={dokumenUrls}
              onChange={setDokumenUrls}
            />
          </div>
        )}

        {activeTab === 5 && (
          <div className="space-y-3">
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={pengesahanMaklumat}
                onChange={(e) => setPengesahanMaklumat(e.target.checked)}
                className="mt-0.5"
              />
              Saya mengesahkan bahawa segala maklumat dan bukti yang dikemukakan adalah <strong>BENAR</strong>{" "}
              sepanjang pengetahuan saya.
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={persetujuanPdpa}
                onChange={(e) => setPersetujuanPdpa(e.target.checked)}
                className="mt-0.5"
              />
              Saya membenarkan Pertubuhan Literasi Tanah memproses maklumat ini untuk tujuan rekod, kajian, dan
              rujukan tindakan undang-undang/badan berkuasa.
            </label>

            <p className="text-xs text-brand-dark/50 pt-2 border-t border-brand-cream">
              <strong>Penafian Perundangan:</strong> Borang ini disediakan oleh Pertubuhan Literasi Tanah bagi
              tujuan pengumpulan maklumat, kesedaran awam, dan advokasi literasi tanah. Penyerahan borang ini{" "}
              <strong>BUKAN</strong> pengganti laporan rasmi di Pejabat Tanah dan Galian (PTG), pihak berkuasa
              tempatan (PBT), atau Polis Diraja Malaysia (PDRM). Pihak Pertubuhan tidak bertanggungjawab secara
              langsung atas sebarang implikasi perundangan antara pihak-pihak yang terlibat.
            </p>

            <p className="text-center text-sm pt-2">
              <Link href="/sumbangan" className="text-brand-gold underline font-semibold">
                💛 Sokong perjuangan kami — Sumbangan Ikhlas
              </Link>
            </p>
          </div>
        )}

        {ralat && <p className="text-sm text-red-600">{ralat}</p>}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 border-t border-brand-cream bg-brand-cream/30">
        <button
          type="button"
          onClick={() => goTab(activeTab - 1)}
          disabled={activeTab === 1}
          className="text-sm font-semibold text-brand-dark/60 hover:text-brand-dark disabled:opacity-0 disabled:pointer-events-none"
        >
          &larr; Sebelumnya
        </button>

        {activeTab < TABS.length ? (
          <button
            type="button"
            onClick={handleNext}
            className="bg-brand-gold text-brand-dark font-semibold px-6 py-2.5 rounded-sm"
          >
            Seterusnya &rarr;
          </button>
        ) : (
          <button
            type="submit"
            disabled={status === "menghantar"}
            className="bg-brand-gold text-brand-dark font-semibold px-6 py-2.5 rounded-sm disabled:opacity-60"
          >
            {status === "menghantar" ? "Menghantar..." : "HANTAR ADUAN"}
          </button>
        )}
      </div>
    </form>
  );
}
