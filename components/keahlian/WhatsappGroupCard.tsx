import Image from "next/image";
import { IconWhatsapp } from "./icons";

const WHATSAPP_GROUP_LINK = "https://chat.whatsapp.com/KN65LeWZqoMKXHG54MHiOc?s=cl&p=i&mlu=4";

export default function WhatsappGroupCard() {
  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
      <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
        <IconWhatsapp />
        <span>3. SERTAI WHATSAPP GROUP</span>
      </div>
      <p className="text-white/60 text-sm mb-5">
        Sertai WhatsApp group ahli Pertubuhan Literasi Tanah untuk terima info kelas, aktiviti dan pengumuman terkini.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="bg-white rounded-md p-3 shrink-0">
          <Image src="/whatsapp-group-qr.svg" width={140} height={140} alt="QR kod WhatsApp group P. L. Tanah Members" />
        </div>
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <p className="text-white/60 text-xs">
            Imbas kod QR guna kamera WhatsApp, atau tekan butang di bawah kalau anda buka laman ni dari telefon.
          </p>
          <a
            href={WHATSAPP_GROUP_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-brand-gold text-brand-dark font-semibold py-3 px-6 rounded-sm w-full sm:w-auto"
          >
            <IconWhatsapp />
            BUKA WHATSAPP GROUP
          </a>
        </div>
      </div>
    </div>
  );
}
