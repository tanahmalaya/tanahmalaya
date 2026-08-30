export const metadata = {
  title: "Terma Perkhidmatan | Pertubuhan Literasi Tanah",
};

function Seksyen({ tajuk, children }: { tajuk: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 className="font-display text-lg font-bold mb-2 text-brand-dark">{tajuk}</h2>
      <div className="text-brand-dark/80 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

export default function TermaPerkhidmatanPage() {
  return (
    <section className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="font-display text-3xl font-bold mb-2">Terma Perkhidmatan</h1>
      <p className="text-sm text-brand-dark/60 mb-10">Kemaskini terakhir: 30 Ogos 2026</p>

      <Seksyen tajuk="1. Penerimaan Terma">
        <p>
          Dengan mengakses atau menggunakan laman web tanahmalaya.org ("Laman") milik
          Pertubuhan Literasi Tanah (PLT), No. Pendaftaran PPM-001-10-17042026, termasuk
          membuat pembelian merchandise atau pendaftaran keahlian/program, anda bersetuju
          terikat dengan Terma Perkhidmatan ini. Sekiranya anda tidak bersetuju, sila
          hentikan penggunaan Laman ini.
        </p>
      </Seksyen>

      <Seksyen tajuk="2. Produk & Harga">
        <p>
          Semua harga merchandise yang dipaparkan adalah dalam Ringgit Malaysia (RM) dan
          termasuk kos penghantaran yang dikira semasa checkout (kecuali dinyatakan
          sebaliknya). PLT berhak meminda harga, penerangan produk, atau menghentikan
          jualan sesuatu produk pada bila-bila masa tanpa notis terlebih dahulu.
        </p>
        <p>
          Ketersediaan stok dipaparkan seboleh mungkin tepat, namun PLT tidak menjamin
          bahawa stok akan sentiasa mencukupi. Sekiranya pesanan tidak dapat dipenuhi
          disebabkan stok habis selepas pembayaran dibuat, PLT akan menghubungi pembeli
          untuk proses pemulangan wang penuh.
        </p>
      </Seksyen>

      <Seksyen tajuk="3. Pembayaran">
        <p>
          Pembayaran diproses melalui gerbang pembayaran pihak ketiga (BayarCash).
          Pesanan akan disahkan hanya selepas pembayaran berjaya diterima. PLT tidak
          menyimpan butiran kad/bank anda - ia diuruskan sepenuhnya oleh penyedia
          gerbang pembayaran.
        </p>
      </Seksyen>

      <Seksyen tajuk="4. Penghantaran">
        <p>
          Penghantaran merchandise diuruskan melalui rakan kurier pihak ketiga
          (contohnya SPX Xpress). Anggaran tempoh penghantaran adalah 3-7 hari bekerja
          selepas pesanan diproses, tertakluk kepada lokasi destinasi dan operasi kurier
          - ia bukan jaminan muktamad.
        </p>
        <p>
          Sila pastikan alamat penghantaran yang diberikan semasa checkout adalah tepat
          dan lengkap. PLT tidak bertanggungjawab ke atas kelewatan atau kegagalan
          penghantaran yang disebabkan oleh alamat tidak lengkap/tidak tepat yang
          diberikan oleh pembeli.
        </p>
      </Seksyen>

      <Seksyen tajuk="5. Pemulangan & Pertukaran">
        <p>
          Pemulangan/pertukaran hanya dilayan untuk produk yang rosak semasa
          penghantaran atau salah dihantar (bukan seperti yang dipesan), dengan syarat
          dilaporkan kepada PLT dalam tempoh 3 hari dari tarikh parcel diterima,
          disertakan gambar/video bukti keadaan produk.
        </p>
        <p>
          Produk yang telah digunakan/dibasuh, atau permintaan pertukaran disebabkan
          salah pilihan saiz oleh pembeli sendiri, tidak dilayan melainkan atas budi
          bicara PLT.
        </p>
      </Seksyen>

      <Seksyen tajuk="6. Pembatalan Pesanan">
        <p>
          Pesanan yang telah dibayar dan diproses untuk penghantaran (tempahan kurier
          dibuat) tidak boleh dibatalkan. Sila hubungi PLT secepat mungkin selepas
          pembayaran jika ingin membatalkan pesanan - pembatalan hanya boleh
          dipertimbangkan sekiranya pesanan belum lagi diproses untuk penghantaran.
        </p>
      </Seksyen>

      <Seksyen tajuk="7. Had Tanggungjawab">
        <p>
          PLT berusaha memastikan semua maklumat di Laman ini tepat, namun tidak
          membuat sebarang jaminan nyata atau tersirat berkenaan ketepatan sepenuhnya.
          PLT tidak bertanggungjawab ke atas sebarang kerugian tidak langsung yang
          timbul daripada penggunaan Laman atau produk yang dibeli, kecuali diwajibkan
          oleh undang-undang yang berkuat kuasa.
        </p>
      </Seksyen>

      <Seksyen tajuk="8. Pindaan Terma">
        <p>
          PLT berhak meminda Terma Perkhidmatan ini pada bila-bila masa. Perubahan akan
          dikemaskini di halaman ini berserta tarikh kemaskini terkini. Penggunaan
          berterusan Laman selepas perubahan bermakna anda menerima terma yang
          dikemaskini.
        </p>
      </Seksyen>

      <Seksyen tajuk="9. Hubungi Kami">
        <p>
          Sebarang pertanyaan berkenaan Terma Perkhidmatan ini boleh dihantar ke{" "}
          <a href="mailto:info@tanahmalaya.org" className="text-brand-gold underline">
            info@tanahmalaya.org
          </a>
          .
        </p>
      </Seksyen>
    </section>
  );
}
