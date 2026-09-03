import Image from "next/image";
import { IconWhatsapp } from "./icons";

const BERSEKUTU_LINK = "https://chat.whatsapp.com/KN65LeWZqoMKXHG54MHiOc?s=cl&p=i&mlu=4";
const BERSEKUTU_QR = "/whatsapp-group-qr.svg";

const PLT_LINK = "https://chat.whatsapp.com/LhryoMo8FYJ4ZWPL4n5twe?s=cl&p=i&mlu=4&ilr=4";
const PLT_QR = "/whatsapp-group-qr-plt.svg";

type Props = {
  variant?: "BERSEKUTU" | "PLT";
};

export default function WhatsappGroupCard({ variant = "BERSEKUTU" }: Props) {
  const link = variant === "PLT" ? PLT_LINK : BERSEKUTU_LINK;
  const qrSrc = variant === "PLT" ? PLT_QR : BERSEKUTU_QR;
  const groupLabel = variant === "PLT" ? "Ahli PLT" : "Ahli Bersekutu";

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-md p-6">
      <div className="flex items-center gap-2 text-brand-gold font-bold mb-1">
        <IconWhatsapp />
        <span>3. SERTAI WHATSAPP GROUP</span>
      </div>
      <p className="text-white/60 text-sm mb-5">
        Sertai WhatsApp group {groupLabel} Pertubuhan Literasi Tanah untuk terima info kelas, aktiviti dan pengumuman terkini.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-5">
        <div className="bg-white rounded-md p-3 shrink-0">
          <Image src={qrSrc} width={140} height={140} alt={`QR kod WhatsApp group ${groupLabel} P. L. Tanah`} priority />
        </div>
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <p className="text-white/60 text-xs">
            Imbas kod QR guna kamera WhatsApp, atau tekan butang di bawah kalau anda buka laman ni dari telefon.
          </p>
          <a
            href={link}
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
