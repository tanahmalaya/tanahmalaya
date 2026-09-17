import Image from "next/image";

// Lambang "GERAN" - huruf "G" bulat dengan corak tanah/sungai hijau, dipotong
// daripada logo penuh disediakan pengguna (public/Geran_logo.jpeg, latar
// putih). Dibalut kotak putih bulat supaya sentiasa kontras bersih di atas
// hero hijau gelap GERAN, macam gaya app-icon.
export default function GeranLogo({ size = 40 }: { size?: number }) {
  return (
    <span
      className="inline-flex items-center justify-center bg-white rounded-xl overflow-hidden shrink-0"
      style={{ width: size, height: size, padding: size * 0.12 }}
    >
      <Image
        src="/geran-logo-g.jpeg"
        alt="GERAN"
        width={size}
        height={size}
        className="w-full h-full object-contain rounded-[3px]"
      />
    </span>
  );
}
